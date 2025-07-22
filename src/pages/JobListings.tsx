import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Clock, DollarSign, Filter, Star, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { Label } from '../components/ui/label'
import { Separator } from '../components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet'
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

const jobTypes = [
  { value: 'temporary', label: 'Temporary' },
  { value: 'locum', label: 'Locum' },
  { value: 'permanent', label: 'Permanent' }
]

const specializations = [
  'General Dentistry',
  'Orthodontics',
  'Endodontics',
  'Periodontics',
  'Oral Surgery',
  'Pediatric Dentistry',
  'Prosthodontics',
  'Oral Pathology',
  'Dental Hygiene'
]

const locations = [
  'London',
  'Manchester',
  'Birmingham',
  'Leeds',
  'Glasgow',
  'Edinburgh',
  'Liverpool',
  'Bristol',
  'Sheffield',
  'Newcastle'
]

export default function JobListings() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedJobType, setSelectedJobType] = useState('')
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [minRate, setMinRate] = useState('')
  const [maxRate, setMaxRate] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      
      // Create sample jobs for demonstration
      const sampleJobs: Job[] = [
        {
          id: '1',
          title: 'Locum Dentist - Central London Practice',
          description: 'Busy central London practice seeking experienced locum dentist for 2-week coverage. Modern facilities with digital X-ray and CEREC technology.',
          location: 'London',
          jobType: 'locum',
          duration: '2 weeks',
          startDate: '2024-02-01',
          endDate: '2024-02-14',
          dailyRate: 450,
          requirements: ['GDC Registration', '2+ years experience', 'Indemnity insurance'],
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
        },
        {
          id: '3',
          title: 'Orthodontist - 6 Month Contract',
          description: 'Specialist orthodontist required for 6-month maternity cover. Established patient base with modern orthodontic equipment.',
          location: 'Birmingham',
          jobType: 'locum',
          duration: '6 months',
          startDate: '2024-03-01',
          endDate: '2024-08-31',
          dailyRate: 650,
          requirements: ['GDC Registration', 'Orthodontic specialty', '5+ years experience'],
          specializationsNeeded: ['Orthodontics'],
          status: 'active',
          applicationsCount: 5,
          createdAt: '2024-01-20',
          practiceId: 'practice3',
          practiceName: 'Birmingham Orthodontics',
          practiceRating: 4.9,
          practiceVerified: true
        },
        {
          id: '4',
          title: 'General Dentist - Holiday Cover',
          description: 'Holiday coverage needed for busy family practice. Mix of NHS and private patients. Friendly team environment.',
          location: 'Leeds',
          jobType: 'temporary',
          duration: '1 week',
          startDate: '2024-02-12',
          endDate: '2024-02-16',
          dailyRate: 380,
          requirements: ['GDC Registration', 'NHS experience preferred'],
          specializationsNeeded: ['General Dentistry', 'Pediatric Dentistry'],
          status: 'active',
          applicationsCount: 15,
          createdAt: '2024-01-22',
          practiceId: 'practice4',
          practiceName: 'Leeds Family Dental',
          practiceRating: 4.5,
          practiceVerified: false
        },
        {
          id: '5',
          title: 'Endodontist - Specialist Referrals',
          description: 'Specialist endodontist needed for referral practice. High-end equipment including microscopes and rotary systems.',
          location: 'Edinburgh',
          jobType: 'locum',
          duration: '3 months',
          startDate: '2024-02-15',
          endDate: '2024-05-15',
          dailyRate: 750,
          requirements: ['GDC Registration', 'Endodontic specialty', 'Microscope experience'],
          specializationsNeeded: ['Endodontics'],
          status: 'active',
          applicationsCount: 3,
          createdAt: '2024-01-25',
          practiceId: 'practice5',
          practiceName: 'Edinburgh Endodontics',
          practiceRating: 4.7,
          practiceVerified: true
        }
      ]
      
      setJobs(sampleJobs)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = !selectedLocation || job.location === selectedLocation
    const matchesJobType = !selectedJobType || job.jobType === selectedJobType
    const matchesSpecializations = selectedSpecializations.length === 0 || 
                                  selectedSpecializations.some(spec => job.specializationsNeeded.includes(spec))
    
    const rate = job.dailyRate || (job.hourlyRate ? job.hourlyRate * 8 : 0)
    const matchesMinRate = !minRate || rate >= parseInt(minRate)
    const matchesMaxRate = !maxRate || rate <= parseInt(maxRate)
    
    return matchesSearch && matchesLocation && matchesJobType && matchesSpecializations && matchesMinRate && matchesMaxRate
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'rate-high': {
        const rateA = a.dailyRate || (a.hourlyRate ? a.hourlyRate * 8 : 0)
        const rateB = b.dailyRate || (b.hourlyRate ? b.hourlyRate * 8 : 0)
        return rateB - rateA
      }
      case 'rate-low': {
        const rateA2 = a.dailyRate || (a.hourlyRate ? a.hourlyRate * 8 : 0)
        const rateB2 = b.dailyRate || (b.hourlyRate ? b.hourlyRate * 8 : 0)
        return rateA2 - rateB2
      }
      default:
        return 0
    }
  })

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      setSelectedSpecializations([...selectedSpecializations, specialization])
    } else {
      setSelectedSpecializations(selectedSpecializations.filter(s => s !== specialization))
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedLocation('')
    setSelectedJobType('')
    setSelectedSpecializations([])
    setMinRate('')
    setMaxRate('')
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
      month: 'short',
      year: 'numeric'
    })
  }

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-3 block">Location</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger>
            <SelectValue placeholder="Any location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any location</SelectItem>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Job Type</Label>
        <Select value={selectedJobType} onValueChange={setSelectedJobType}>
          <SelectTrigger>
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any type</SelectItem>
            {jobTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Specializations</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {specializations.map(specialization => (
            <div key={specialization} className="flex items-center space-x-2">
              <Checkbox
                id={specialization}
                checked={selectedSpecializations.includes(specialization)}
                onCheckedChange={(checked) => handleSpecializationChange(specialization, checked as boolean)}
              />
              <Label htmlFor={specialization} className="text-sm">{specialization}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Daily Rate Range (£)</Label>
        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="Min"
            value={minRate}
            onChange={(e) => setMinRate(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxRate}
            onChange={(e) => setMaxRate(e.target.value)}
          />
        </div>
      </div>

      <Button variant="outline" onClick={clearFilters} className="w-full">
        Clear Filters
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Dental Jobs</h1>
          <p className="text-gray-600">Discover locum and temporary dental positions across the UK</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search jobs, locations, or specializations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="rate-high">Highest Rate</SelectItem>
                  <SelectItem value="rate-low">Lowest Rate</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filter Jobs</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedLocation || selectedJobType || selectedSpecializations.length > 0 || minRate || maxRate) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedLocation && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedLocation('')}>
                  {selectedLocation} ×
                </Badge>
              )}
              {selectedJobType && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedJobType('')}>
                  {jobTypes.find(t => t.value === selectedJobType)?.label} ×
                </Badge>
              )}
              {selectedSpecializations.map(spec => (
                <Badge key={spec} variant="secondary" className="cursor-pointer" 
                       onClick={() => handleSpecializationChange(spec, false)}>
                  {spec} ×
                </Badge>
              ))}
              {(minRate || maxRate) && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => {setMinRate(''); setMaxRate('')}}>
                  £{minRate || '0'} - £{maxRate || '∞'} ×
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filter Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent />
              </CardContent>
            </Card>
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${sortedJobs.length} job${sortedJobs.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedJobs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
                  <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 hover:text-primary">
                              <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                            </h3>
                            {job.practiceVerified && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{job.duration}</span>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline">{job.jobType}</Badge>
                            {job.specializationsNeeded.map(spec => (
                              <Badge key={spec} variant="secondary">{spec}</Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-medium">{formatRate(job)}</span>
                              </div>
                              <span>Starts {formatDate(job.startDate)}</span>
                              <span>{job.applicationsCount} applications</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/jobs/${job.id}`}>View Details</Link>
                              </Button>
                              <Button size="sm" asChild>
                                <Link to={`/jobs/${job.id}`}>Apply Now</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}