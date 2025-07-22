import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  Search,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import blink from '../blink/client'

interface User {
  id: string
  email: string
  fullName?: string
  userType?: string
  avatarUrl?: string
}

interface Job {
  id: string
  title: string
  location: string
  jobType: string
  hourlyRateMin: number
  hourlyRateMax: number
  startDate: string
  endDate: string
  status: string
  createdAt: string
  practice?: {
    practiceName: string
    rating: number
    isVerified: boolean
  }
}

interface Application {
  id: string
  jobId: string
  status: string
  coverLetter: string
  availableStartDate: string
  availableEndDate: string
  createdAt: string
  job?: {
    title: string
    location: string
    hourlyRateMin: number
    hourlyRateMax: number
  }
  practice?: {
    practiceName: string
    rating: number
  }
}

interface Notification {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  relatedId?: string
}

interface DentistDashboardProps {
  user: User
}

export default function DentistDashboard({ user }: DentistDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    unreadNotifications: 0
  })

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load applications by this dentist
      const applicationsData = await blink.db.applications.list({
        where: { dentistId: user.id },
        orderBy: { appliedAt: 'desc' },
        limit: 20
      })

      // Load notifications for this user
      const notificationsData = await blink.db.notifications.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 10
      })

      // Load recommended jobs (recent active jobs)
      const jobsData = await blink.db.jobs.list({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        limit: 6
      })

      // Get job details for applications
      const jobIds = [...new Set(applicationsData.map(app => app.jobId))]
      const jobDetails = await Promise.all(
        jobIds.map(async (jobId) => {
          const job = await blink.db.jobs.list({
            where: { id: jobId },
            limit: 1
          })
          return job[0]
        })
      )

      // Get practice details for applications (from jobs table)
      const practiceIds = [...new Set(jobDetails.filter(job => job).map(job => job.practiceId))]
      const practiceDetails = await Promise.all(
        practiceIds.map(async (practiceId) => {
          const practice = await blink.db.users.list({
            where: { userId: practiceId },
            limit: 1
          })
          return practice[0]
        })
      )

      // Combine application data with job and practice details
      const enrichedApplications = applicationsData.map(app => {
        const job = jobDetails.find(job => job?.id === app.jobId)
        const practice = practiceDetails.find(practice => practice?.userId === job?.practiceId)
        return {
          ...app,
          job,
          practice
        }
      })

      setApplications(enrichedApplications)
      setNotifications(notificationsData)
      setRecommendedJobs(jobsData)

      // Calculate stats
      const pendingApps = applicationsData.filter(app => app.status === 'pending').length
      const acceptedApps = applicationsData.filter(app => app.status === 'accepted').length
      const unreadNotifs = notificationsData.filter(notif => !Number(notif.isRead)).length

      setStats({
        totalApplications: applicationsData.length,
        pendingApplications: pendingApps,
        acceptedApplications: acceptedApps,
        unreadNotifications: unreadNotifs
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await blink.db.notifications.update(notificationId, {
        isRead: true
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
      
      // Update stats
      setStats(prev => ({
        ...prev,
        unreadNotifications: Math.max(0, prev.unreadNotifications - 1)
      }))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-orange-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'default'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dentist Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your applications and find new opportunities</p>
          </div>
          <Link to="/jobs">
            <Button className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Jobs
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                </div>
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{stats.acceptedApplications}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Notifications</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.unreadNotifications}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="jobs">Recommended Jobs</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>
                  Track the status of your job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-600 mb-4">Start applying to jobs to see your applications here</p>
                    <Link to="/jobs">
                      <Button>Browse Jobs</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {getStatusIcon(application.status)}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {application.job?.title || 'Job Title'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {application.practice?.practiceName || 'Practice Name'}
                                </p>
                              </div>
                              <Badge variant={getStatusColor(application.status)}>
                                {application.status}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {application.job?.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${application.job?.hourlyRateMin}-${application.job?.hourlyRateMax}/hr
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Available: {new Date(application.availableStartDate).toLocaleDateString()} - {new Date(application.availableEndDate).toLocaleDateString()}
                              </div>
                            </div>

                            {application.coverLetter && (
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-1">Your Cover Letter:</h4>
                                <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md">
                                  {application.coverLetter.length > 200 
                                    ? `${application.coverLetter.substring(0, 200)}...` 
                                    : application.coverLetter
                                  }
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {application.practice?.rating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">★</span>
                                  {application.practice.rating.toFixed(1)}
                                </div>
                              )}
                              <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 lg:w-auto w-full">
                            <Link to={`/jobs/${application.jobId}`}>
                              <Button variant="outline" className="w-full">
                                View Job
                              </Button>
                            </Link>
                            {application.status === 'accepted' && (
                              <Link to={`/messages?conversation=${application.practiceId}`}>
                                <Button className="w-full">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Message Practice
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Jobs</CardTitle>
                <CardDescription>
                  Jobs that match your profile and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
                    <p className="text-gray-600">Check back later for new opportunities</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendedJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${job.hourlyRateMin}-${job.hourlyRateMax}/hr
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{job.jobType}</span>
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link to={`/jobs/${job.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">View Details</Button>
                          </Link>
                          <Link to={`/jobs/${job.id}`} className="flex-1">
                            <Button className="w-full">Apply Now</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Stay updated on your applications and new opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-600">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          Number(notification.isRead) > 0 ? 'bg-white' : 'bg-blue-50 border-blue-200'
                        }`}
                        onClick={() => !Number(notification.isRead) && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              {!Number(notification.isRead) && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm mb-2">{notification.content}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {notification.relatedId && (
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}