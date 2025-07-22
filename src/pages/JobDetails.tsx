import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Clock, DollarSign, Calendar, Star, CheckCircle, ArrowLeft, Send, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Separator } from '../components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import blink from '../blink/client'

interface Job {
  id: string
  title: string
  description: string
  location: string
  jobType: string
  duration?: string
  startDate: string
  endDate?: string
  hourlyRate?: number
  dailyRate?: number
  requirements: string[]
  specializationsNeeded: string[]
  status: string
  applicationsCount: number
  createdAt: string
  practiceId: string
  practiceName?: string
  practiceRating?: number
  practiceVerified?: boolean
}

interface ApplicationData {
  coverLetter: string
  availabilityStart: string
  availabilityEnd: string
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [applying, setApplying] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    coverLetter: '',
    availabilityStart: '',
    availabilityEnd: ''
  })
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadJob = useCallback(async () => {
    try {
      setLoading(true)
      
      // Sample job data - in real app, this would come from database
      const sampleJobs: Job[] = [
        {
          id: '1',
          title: 'Locum Dentist - Central London Practice',
          description: 'Busy central London practice seeking experienced locum dentist for 2-week coverage. Modern facilities with digital X-ray and CEREC technology.\n\nWe are a well-established practice in the heart of London, serving a diverse patient base. Our team is friendly and supportive, and we pride ourselves on providing excellent patient care.\n\nFacilities include:\n• Digital X-ray systems\n• CEREC same-day crowns\n• Modern sterilization equipment\n• Electronic patient records\n• On-site parking available\n\nThe successful candidate will be working alongside our experienced team and will have access to all modern dental equipment. This is an excellent opportunity for a dentist looking to gain experience in a busy London practice.',
          location: 'London',
          jobType: 'locum',
          duration: '2 weeks',
          startDate: '2024-02-01',
          endDate: '2024-02-14',
          dailyRate: 450,
          requirements: ['GDC Registration', '2+ years experience', 'Indemnity insurance', 'DBS check'],
          specializationsNeeded: ['General Dentistry'],
          status: 'active',
          applicationsCount: 12,
          createdAt: '2024-01-15',
          practiceId: 'practice1',
          practiceName: 'Harley Street Dental',
          practiceRating: 4.8,
          practiceVerified: true
        },
        {
          id: '2',
          title: 'Emergency Dental Cover - Weekend',
          description: 'Weekend emergency dental coverage needed for established practice. Experience with emergency procedures essential.',
          location: 'Manchester',
          jobType: 'temporary',
          duration: 'Weekend',
          startDate: '2024-01-27',
          endDate: '2024-01-28',
          hourlyRate: 65,
          requirements: ['GDC Registration', 'Emergency experience', 'Available weekends'],
          specializationsNeeded: ['General Dentistry', 'Oral Surgery'],
          status: 'active',
          applicationsCount: 8,
          createdAt: '2024-01-18',
          practiceId: 'practice2',
          practiceName: 'Manchester Dental Care',
          practiceRating: 4.6,
          practiceVerified: true
        }
      ]
      
      const foundJob = sampleJobs.find(j => j.id === id)
      setJob(foundJob || null)
    } catch (error) {
      console.error('Error loading job:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadJob()
  }, [loadJob])

  const handleApply = async () => {
    if (!user) {
      blink.auth.login()
      return
    }

    try {
      setApplying(true)

      // Create application record
      const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await blink.db.applications.create({
        id: applicationId,
        jobId: id!,
        dentistId: user.id,
        status: 'pending',
        coverLetter: applicationData.coverLetter,
        availabilityStart: applicationData.availabilityStart,
        availabilityEnd: applicationData.availabilityEnd,
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      setHasApplied(true)
      alert('Application submitted successfully!')
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const formatRate = (job: Job) => {
    if (job.dailyRate) {
      return `£${job.dailyRate}/day`
    } else if (job.hourlyRate) {
      return `£${job.hourlyRate}/hour`
    }
    return 'Rate TBD'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Job not found</h3>
            <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link to="/jobs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                      {job.practiceVerified && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{job.practiceName}</span>
                        {job.practiceRating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{job.practiceRating}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">{job.jobType}</Badge>
                      {job.specializationsNeeded.map(spec => (
                        <Badge key={spec} variant="secondary">{spec}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">{formatRate(job)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{job.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Starts {formatDate(job.startDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {job.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0 text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Card */}
            <Card>
              <CardHeader>
                <CardTitle>Apply for this Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>{job.applicationsCount} applications so far</p>
                </div>

                {hasApplied ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-700">Application Submitted</p>
                    <p className="text-sm text-gray-600">We'll notify you when the practice responds</p>
                  </div>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Apply for {job.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div>
                          <Label htmlFor="coverLetter" className="text-sm font-medium">
                            Cover Letter
                          </Label>
                          <Textarea
                            id="coverLetter"
                            placeholder="Tell the practice why you're interested in this position..."
                            value={applicationData.coverLetter}
                            onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                            className="mt-1 min-h-32"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="availabilityStart" className="text-sm font-medium">
                              Available From
                            </Label>
                            <Input
                              id="availabilityStart"
                              type="date"
                              value={applicationData.availabilityStart}
                              onChange={(e) => setApplicationData(prev => ({ ...prev, availabilityStart: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="availabilityEnd" className="text-sm font-medium">
                              Available Until
                            </Label>
                            <Input
                              id="availabilityEnd"
                              type="date"
                              value={applicationData.availabilityEnd}
                              onChange={(e) => setApplicationData(prev => ({ ...prev, availabilityEnd: e.target.value }))}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <DialogTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogTrigger>
                          <Button onClick={handleApply} disabled={applying}>
                            {applying ? 'Submitting...' : 'Submit Application'}
                            <Send className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Type:</span>
                    <span className="font-medium capitalize">{job.jobType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{job.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{formatDate(job.startDate)}</span>
                  </div>
                  {job.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{formatDate(job.endDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium">{formatRate(job)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Practice Info */}
            <Card>
              <CardHeader>
                <CardTitle>About the Practice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{job.practiceName}</span>
                  {job.practiceVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                {job.practiceRating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(job.practiceRating!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{job.practiceRating} rating</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  View Practice Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}