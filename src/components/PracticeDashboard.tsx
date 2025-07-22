import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  Briefcase, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Plus,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  UserCheck,
  Calendar
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
  applicationsCount?: number
}

interface Application {
  id: string
  jobId: string
  applicantId: string
  status: string
  coverLetter: string
  availableStartDate: string
  availableEndDate: string
  createdAt: string
  job?: {
    title: string
  }
  applicant?: {
    fullName: string
    email: string
    avatarUrl?: string
    rating: number
    specializations: string
  }
}

interface PracticeDashboardProps {
  user: User
}

export default function PracticeDashboard({ user }: PracticeDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  })

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load jobs posted by this practice
      const jobsData = await blink.db.jobs.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 10
      })

      // Load applications for practice jobs
      // First get jobs by this practice, then get applications for those jobs
      const practiceJobs = await blink.db.jobs.list({
        where: { practiceId: user.id }
      })
      
      const practiceJobIds = practiceJobs.map(job => job.id)
      
      const applicationsData = practiceJobIds.length > 0 ? await blink.db.applications.list({
        where: { jobId: { in: practiceJobIds } },
        orderBy: { appliedAt: 'desc' },
        limit: 20
      }) : []

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

      // Get applicant details
      const applicantIds = [...new Set(applicationsData.map(app => app.dentistId))]
      const applicantDetails = await Promise.all(
        applicantIds.map(async (dentistId) => {
          const applicant = await blink.db.users.list({
            where: { userId: dentistId },
            limit: 1
          })
          return applicant[0]
        })
      )

      // Combine application data with job and applicant details
      const enrichedApplications = applicationsData.map(app => ({
        ...app,
        job: jobDetails.find(job => job?.id === app.jobId),
        applicant: applicantDetails.find(applicant => applicant?.userId === app.dentistId)
      }))

      setJobs(jobsData)
      setApplications(enrichedApplications)

      // Calculate stats
      const activeJobs = jobsData.filter(job => job.status === 'active').length
      const pendingApps = applicationsData.filter(app => app.status === 'pending').length

      setStats({
        totalJobs: jobsData.length,
        activeJobs,
        totalApplications: applicationsData.length,
        pendingApplications: pendingApps
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

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      await blink.db.applications.update(applicationId, {
        status: action === 'accept' ? 'accepted' : 'rejected'
      })

      // Send notification to applicant
      const application = applications.find(app => app.id === applicationId)
      if (application) {
        await blink.db.notifications.create({
          id: `notif_${Date.now()}`,
          userId: application.dentistId,
          type: 'application_response',
          title: `Application ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
          content: `Your application for "${application.job?.title}" has been ${action}ed.`,
          relatedId: applicationId
        })

        // Send email notification
        try {
          await blink.notifications.email({
            to: application.applicant?.email || '',
            subject: `Application ${action === 'accept' ? 'Accepted' : 'Rejected'} - ${application.job?.title}`,
            html: `
              <h2>Application Update</h2>
              <p>Your application for the position "${application.job?.title}" has been ${action}ed.</p>
              ${action === 'accept' ? 
                '<p>Congratulations! The practice will be in touch with you soon to discuss next steps.</p>' :
                '<p>Thank you for your interest. We encourage you to apply for other positions that match your qualifications.</p>'
              }
              <p>Best regards,<br>DentalLocus Team</p>
            `
          })
        } catch (emailError) {
          console.error('Error sending email notification:', emailError)
        }
      }

      // Reload data
      loadDashboardData()
    } catch (error) {
      console.error('Error updating application:', error)
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
            <h1 className="text-3xl font-bold text-gray-900">Practice Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your job postings and applications</p>
          </div>
          <Link to="/post-job">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeJobs}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jobs">My Job Postings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Postings</CardTitle>
                <CardDescription>
                  Manage your active and past job listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                    <p className="text-gray-600 mb-4">Start by posting your first job to find qualified dentists</p>
                    <Link to="/post-job">
                      <Button>Post Your First Job</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                              <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                                {job.status}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${job.hourlyRateMin}-${job.hourlyRateMax}/hr
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {job.applicationsCount || 0} applications
                              </div>
                              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link to={`/jobs/${job.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                            <Button variant="outline" size="sm">Edit</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Applications</CardTitle>
                <CardDescription>
                  Review and manage applications from dentists
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-600">Applications will appear here once dentists apply to your jobs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                {application.applicant?.avatarUrl ? (
                                  <img 
                                    src={application.applicant.avatarUrl} 
                                    alt={application.applicant.fullName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-primary font-medium">
                                    {application.applicant?.fullName?.charAt(0) || 'D'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {application.applicant?.fullName || 'Dentist'}
                                </h3>
                                <p className="text-sm text-gray-600">{application.applicant?.email}</p>
                              </div>
                              <Badge variant={
                                application.status === 'pending' ? 'secondary' :
                                application.status === 'accepted' ? 'default' : 'destructive'
                              }>
                                {application.status}
                              </Badge>
                            </div>

                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-1">Applied for:</h4>
                              <p className="text-gray-700">{application.job?.title}</p>
                            </div>

                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-1">Availability:</h4>
                              <p className="text-gray-700">
                                {new Date(application.availableStartDate).toLocaleDateString()} - {new Date(application.availableEndDate).toLocaleDateString()}
                              </p>
                            </div>

                            {application.coverLetter && (
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 mb-1">Cover Letter:</h4>
                                <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md">
                                  {application.coverLetter}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {application.applicant?.rating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">★</span>
                                  {application.applicant.rating.toFixed(1)}
                                </div>
                              )}
                              {application.applicant?.specializations && (
                                <span>Specializations: {application.applicant.specializations}</span>
                              )}
                              <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {application.status === 'pending' && (
                            <div className="flex flex-col gap-2 lg:w-auto w-full">
                              <Button 
                                onClick={() => handleApplicationAction(application.id, 'accept')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Accept
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleApplicationAction(application.id, 'reject')}
                              >
                                Reject
                              </Button>
                              <Link to={`/messages?conversation=${application.dentistId}`}>
                                <Button variant="outline" className="w-full">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Message
                                </Button>
                              </Link>
                            </div>
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