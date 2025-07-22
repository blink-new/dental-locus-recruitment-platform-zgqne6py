import { useState } from 'react'
import { Search, MapPin, Clock, Star, CheckCircle, Users, Building2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import Navigation from '@/components/Navigation'

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')

  const featuredJobs = [
    {
      id: 1,
      title: 'General Dentist - Locum',
      practice: 'Smile Dental Clinic',
      location: 'London, UK',
      duration: '2 weeks',
      rate: '£450/day',
      type: 'Temporary',
      urgent: true,
      rating: 4.8,
      verified: true
    },
    {
      id: 2,
      title: 'Orthodontist - Weekend Cover',
      practice: 'Central Orthodontics',
      location: 'Manchester, UK',
      duration: '3 months',
      rate: '£600/day',
      type: 'Part-time',
      urgent: false,
      rating: 4.9,
      verified: true
    },
    {
      id: 3,
      title: 'Oral Surgeon - Emergency Cover',
      practice: 'City Dental Hospital',
      location: 'Birmingham, UK',
      duration: '1 month',
      rate: '£750/day',
      type: 'Full-time',
      urgent: true,
      rating: 4.7,
      verified: true
    }
  ]

  const stats = [
    { icon: Users, label: 'Active Dentists', value: '2,500+' },
    { icon: Building2, label: 'Partner Practices', value: '850+' },
    { icon: Calendar, label: 'Jobs Filled', value: '15,000+' },
    { icon: Star, label: 'Average Rating', value: '4.8/5' }
  ]

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'General Dentist',
      content: 'DentalLocus has transformed how I find locum work. The platform is intuitive and I\'ve found consistent, well-paying positions.',
      rating: 5,
      avatar: '/api/placeholder/64/64'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Orthodontist',
      content: 'As a practice owner, finding qualified locum dentists used to be a nightmare. This platform solved that problem completely.',
      rating: 5,
      avatar: '/api/placeholder/64/64'
    },
    {
      name: 'Dr. Emma Williams',
      role: 'Oral Surgeon',
      content: 'The verification system gives me confidence in both the practices I work with and the dentists we hire.',
      rating: 5,
      avatar: '/api/placeholder/64/64'
    }
  ]

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Connect with
              <span className="text-primary"> Dental Professionals</span>
              <br />
              <span className="text-accent">Instantly</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The UK's leading platform for dental locum recruitment. Find qualified dentists or discover your next opportunity in seconds.
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Search for dental positions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg border-0 focus-visible:ring-1"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Location..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 h-12 text-lg border-0 focus-visible:ring-1"
                  />
                </div>
                <Button size="lg" className="h-12 px-8 text-lg font-medium">
                  <Search className="mr-2 h-5 w-5" />
                  Search Jobs
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/jobs">
                <Button variant="outline" size="lg" className="h-12">
                  Browse All Jobs
                </Button>
              </Link>
              <Link to="/post-job">
                <Button variant="outline" size="lg" className="h-12">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Featured Opportunities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover high-quality locum positions from verified dental practices across the UK.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featuredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Building2 className="h-4 w-4 mr-1" />
                        {job.practice}
                        {job.verified && (
                          <CheckCircle className="h-4 w-4 ml-2 text-accent" />
                        )}
                      </CardDescription>
                    </div>
                    {job.urgent && (
                      <Badge variant="destructive" className="ml-2">
                        Urgent
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {job.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {job.duration} • {job.type}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-primary">
                        {job.rate}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium">{job.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/jobs">
              <Button size="lg" className="h-12 px-8">
                View All Jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">What Our Community Says</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Trusted by thousands of dental professionals across the UK.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-semibold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of dental professionals who trust DentalLocus for their recruitment needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-12 px-8">
              Find Locum Work
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-white border-white hover:bg-white hover:text-primary">
              Hire Dentists
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">DentalLocus</h3>
              <p className="text-gray-300 mb-4">
                Connecting dental professionals with opportunities across the UK.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Dentists</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/jobs" className="hover:text-white">Find Jobs</Link></li>
                <li><Link to="/profile" className="hover:text-white">Create Profile</Link></li>
                <li><Link to="/applications" className="hover:text-white">My Applications</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Practices</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/post-job" className="hover:text-white">Post Jobs</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link to="/messages" className="hover:text-white">Messages</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 DentalLocus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage