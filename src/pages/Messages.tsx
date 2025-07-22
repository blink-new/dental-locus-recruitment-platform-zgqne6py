import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { 
  Send, 
  MessageSquare, 
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft
} from 'lucide-react'
import blink from '../blink/client'

interface User {
  id: string
  email: string
  fullName?: string
  userType?: string
  avatarUrl?: string
  practiceName?: string
  isVerified?: boolean
}

interface Conversation {
  id: string
  participant1Id: string
  participant2Id: string
  jobId?: string
  lastMessageAt: string
  otherUser?: User
  job?: {
    title: string
  }
  lastMessage?: {
    content: string
    senderId: string
  }
  unreadCount?: number
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  messageType: string
  isRead: boolean
  createdAt: string
}

export default function Messages() {
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const messagesData = await blink.db.messages.list({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      })

      setMessages(messagesData)

      // Mark messages as read
      const unreadMessages = messagesData.filter(msg => 
        msg.senderId !== user?.id && !Number(msg.isRead)
      )

      for (const message of unreadMessages) {
        await blink.db.messages.update(message.id, { isRead: true })
      }

      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )

    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [user?.id])

  const loadUserAndConversations = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get current user
      const currentUser = await blink.auth.me()
      if (!currentUser) return

      // Get user profile
      const userProfile = await blink.db.users.list({
        where: { userId: currentUser.id },
        limit: 1
      })

      const userData = userProfile.length > 0 ? {
        id: currentUser.id,
        email: currentUser.email,
        fullName: userProfile[0].fullName,
        userType: userProfile[0].userType,
        avatarUrl: userProfile[0].avatarUrl,
        practiceName: userProfile[0].practiceName,
        isVerified: userProfile[0].isVerified
      } : {
        id: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.email.split('@')[0],
        userType: 'dentist'
      }

      setUser(userData)

      // Load conversations
      const conversationsData = await blink.db.conversations.list({
        where: {
          OR: [
            { participant1Id: currentUser.id },
            { participant2Id: currentUser.id }
          ]
        },
        orderBy: { lastMessageAt: 'desc' }
      })

      // Get other participants and job details
      const enrichedConversations = await Promise.all(
        conversationsData.map(async (conv) => {
          const otherUserId = conv.participant1Id === currentUser.id 
            ? conv.participant2Id 
            : conv.participant1Id

          // Get other user details
          const otherUserData = await blink.db.users.list({
            where: { userId: otherUserId },
            limit: 1
          })

          // Get job details if exists
          let jobData = null
          if (conv.jobId) {
            const job = await blink.db.jobs.list({
              where: { id: conv.jobId },
              limit: 1
            })
            jobData = job[0]
          }

          // Get last message
          const lastMessage = await blink.db.messages.list({
            where: { conversationId: conv.id },
            orderBy: { createdAt: 'desc' },
            limit: 1
          })

          // Count unread messages
          const unreadMessages = await blink.db.messages.list({
            where: { 
              conversationId: conv.id,
              senderId: { not: currentUser.id },
              isRead: false
            }
          })

          return {
            ...conv,
            otherUser: otherUserData[0] ? {
              id: otherUserData[0].userId,
              email: otherUserData[0].email,
              fullName: otherUserData[0].fullName,
              userType: otherUserData[0].userType,
              avatarUrl: otherUserData[0].avatarUrl,
              practiceName: otherUserData[0].practiceName,
              isVerified: otherUserData[0].isVerified
            } : null,
            job: jobData ? { title: jobData.title } : null,
            lastMessage: lastMessage[0] ? {
              content: lastMessage[0].content,
              senderId: lastMessage[0].senderId
            } : null,
            unreadCount: unreadMessages.length
          }
        })
      )

      setConversations(enrichedConversations)

      // Auto-select conversation from URL params
      const conversationParam = searchParams.get('conversation')
      if (conversationParam && enrichedConversations.length > 0) {
        const targetConversation = enrichedConversations.find(conv => 
          conv.otherUser?.id === conversationParam
        )
        if (targetConversation) {
          setSelectedConversation(targetConversation)
          loadMessages(targetConversation.id)
        }
      }

    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [loadMessages, searchParams])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    try {
      setSendingMessage(true)

      const messageId = `msg_${Date.now()}`
      const message = {
        id: messageId,
        conversationId: selectedConversation.id,
        senderId: user.id,
        content: newMessage.trim(),
        messageType: 'text',
        isRead: false
      }

      // Add message to local state immediately
      setMessages(prev => [...prev, message])
      setNewMessage('')

      // Save to database
      await blink.db.messages.create(message)

      // Update conversation last message time
      await blink.db.conversations.update(selectedConversation.id, {
        lastMessageAt: new Date().toISOString()
      })

      // Send email notification to other user
      if (selectedConversation.otherUser?.email) {
        try {
          await blink.notifications.email({
            to: selectedConversation.otherUser.email,
            subject: `New message from ${user.fullName || user.email}`,
            html: `
              <h2>New Message</h2>
              <p>You have received a new message from <strong>${user.fullName || user.email}</strong>:</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                "${newMessage.trim()}"
              </div>
              ${selectedConversation.job ? `<p>Regarding: <strong>${selectedConversation.job.title}</strong></p>` : ''}
              <p><a href="${window.location.origin}/messages">Reply on DentalLocus</a></p>
              <p>Best regards,<br>DentalLocus Team</p>
            `
          })
        } catch (emailError) {
          console.error('Error sending email notification:', emailError)
        }
      }

      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                lastMessageAt: new Date().toISOString(),
                lastMessage: { content: newMessage.trim(), senderId: user.id }
              }
            : conv
        )
      )

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const createOrFindConversation = async (otherUserId: string, jobId?: string) => {
    if (!user) return

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        conv.otherUser?.id === otherUserId
      )

      if (existingConversation) {
        setSelectedConversation(existingConversation)
        loadMessages(existingConversation.id)
        return
      }

      // Create new conversation
      const conversationId = `conv_${Date.now()}`
      const newConversation = {
        id: conversationId,
        participant1Id: user.id,
        participant2Id: otherUserId,
        jobId: jobId || null,
        lastMessageAt: new Date().toISOString()
      }

      await blink.db.conversations.create(newConversation)

      // Reload conversations to get the new one with user details
      loadUserAndConversations()

    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  useEffect(() => {
    loadUserAndConversations()
  }, [loadUserAndConversations])

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const otherUser = conv.otherUser
    const searchLower = searchQuery.toLowerCase()
    return (
      otherUser?.fullName?.toLowerCase().includes(searchLower) ||
      otherUser?.email?.toLowerCase().includes(searchLower) ||
      otherUser?.practiceName?.toLowerCase().includes(searchLower) ||
      conv.job?.title?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            {/* Conversations List */}
            <div className={`lg:w-1/3 ${selectedConversation ? 'hidden lg:block' : 'block'}`}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 max-h-[calc(100vh-16rem)] overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                        <p className="text-gray-600 text-sm">
                          {searchQuery ? 'No conversations match your search' : 'Start a conversation by applying to jobs or posting opportunities'}
                        </p>
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-primary/5 border-primary/20' : ''
                          }`}
                          onClick={() => {
                            setSelectedConversation(conversation)
                            loadMessages(conversation.id)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={conversation.otherUser?.avatarUrl} />
                                <AvatarFallback>
                                  {conversation.otherUser?.fullName?.charAt(0) || 
                                   conversation.otherUser?.email?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              {conversation.unreadCount && conversation.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {conversation.otherUser?.userType === 'practice' 
                                    ? conversation.otherUser?.practiceName || conversation.otherUser?.fullName
                                    : conversation.otherUser?.fullName || conversation.otherUser?.email
                                  }
                                </h4>
                                {conversation.otherUser?.isVerified && (
                                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                                )}
                              </div>
                              
                              {conversation.job && (
                                <p className="text-xs text-primary mb-1">Re: {conversation.job.title}</p>
                              )}
                              
                              {conversation.lastMessage && (
                                <p className="text-sm text-gray-600 truncate">
                                  {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                                  {conversation.lastMessage.content}
                                </p>
                              )}
                              
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(conversation.lastMessageAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className={`lg:w-2/3 ${selectedConversation ? 'block' : 'hidden lg:block'}`}>
              {selectedConversation ? (
                <Card className="h-full flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="lg:hidden"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedConversation.otherUser?.avatarUrl} />
                          <AvatarFallback>
                            {selectedConversation.otherUser?.fullName?.charAt(0) || 
                             selectedConversation.otherUser?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {selectedConversation.otherUser?.userType === 'practice' 
                              ? selectedConversation.otherUser?.practiceName || selectedConversation.otherUser?.fullName
                              : selectedConversation.otherUser?.fullName || selectedConversation.otherUser?.email
                            }
                          </h3>
                          {selectedConversation.job && (
                            <p className="text-sm text-primary">Re: {selectedConversation.job.title}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
                            <p className="text-gray-600">Send your first message below</p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.senderId === user?.id
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                  message.senderId === user?.id ? 'text-primary-foreground/70' : 'text-gray-500'
                                }`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="border-t p-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            disabled={sendingMessage}
                            className="flex-1"
                          />
                          <Button 
                            onClick={sendMessage} 
                            disabled={!newMessage.trim() || sendingMessage}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}