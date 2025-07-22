import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import PracticeDashboard from '../components/PracticeDashboard'
import DentistDashboard from '../components/DentistDashboard'
import blink from '../blink/client'

interface User {
  id: string
  email: string
  fullName?: string
  userType?: string
  avatarUrl?: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      if (state.user) {
        try {
          // Get user profile from database
          const userProfile = await blink.db.users.list({
            where: { userId: state.user.id },
            limit: 1
          })
          
          if (userProfile.length > 0) {
            setUser({
              id: state.user.id,
              email: state.user.email,
              fullName: userProfile[0].fullName,
              userType: userProfile[0].userType,
              avatarUrl: userProfile[0].avatarUrl
            })
          } else {
            // Create user profile if doesn't exist
            await blink.db.users.create({
              id: `user_${Date.now()}`,
              userId: state.user.id,
              email: state.user.email,
              fullName: state.user.email.split('@')[0],
              userType: 'dentist' // Default to dentist
            })
            setUser({
              id: state.user.id,
              email: state.user.email,
              fullName: state.user.email.split('@')[0],
              userType: 'dentist'
            })
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      } else {
        navigate('/jobs')
      }
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [navigate])

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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      {user.userType === 'practice' ? (
        <PracticeDashboard user={user} />
      ) : (
        <DentistDashboard user={user} />
      )}
    </div>
  )
}