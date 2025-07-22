import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Calendar,
  Award,
  Upload,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  X
} from 'lucide-react'
import blink from '../blink/client'

interface UserProfile {
  id: string
  email: string
  fullName?: string
  userType?: string
  phone?: string
  location?: string
  bio?: string
  avatarUrl?: string
  isVerified?: boolean
  rating?: number
  totalReviews?: number
  
  // Dentist-specific fields
  licenseNumber?: string
  specializations?: string
  yearsExperience?: number
  education?: string
  certifications?: string
  availability?: string
  
  // Practice-specific fields
  practiceName?: string
  practiceType?: string
  websiteUrl?: string
  establishedYear?: number
  staffSize?: string
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [newSpecialization, setNewSpecialization] = useState('')
  const [newCertification, setNewCertification] = useState('')
  const navigate = useNavigate()

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get current user
      const currentUser = await blink.auth.me()
      if (!currentUser) {
        navigate('/jobs')
        return
      }

      // Get user profile from database
      const userProfile = await blink.db.users.list({
        where: { userId: currentUser.id },
        limit: 1
      })

      if (userProfile.length > 0) {
        const profile = {
          id: currentUser.id,
          email: currentUser.email,
          ...userProfile[0]
        }
        setUser(profile)
        setFormData(profile)
      } else {
        // Create initial profile
        const initialProfile = {
          id: `user_${Date.now()}`,
          userId: currentUser.id,
          email: currentUser.email,
          fullName: currentUser.email.split('@')[0],
          userType: 'dentist'
        }
        
        await blink.db.users.create(initialProfile)
        
        const profile = {
          id: currentUser.id,
          email: currentUser.email,
          fullName: initialProfile.fullName,
          userType: initialProfile.userType
        }
        setUser(profile)
        setFormData(profile)
      }

    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSpecialization = () => {
    if (!newSpecialization.trim()) return
    
    const currentSpecs = formData.specializations ? JSON.parse(formData.specializations) : []
    const updatedSpecs = [...currentSpecs, newSpecialization.trim()]
    
    setFormData(prev => ({ ...prev, specializations: JSON.stringify(updatedSpecs) }))
    setNewSpecialization('')
  }

  const removeSpecialization = (index: number) => {
    const currentSpecs = formData.specializations ? JSON.parse(formData.specializations) : []
    const updatedSpecs = currentSpecs.filter((_: string, i: number) => i !== index)
    
    setFormData(prev => ({ ...prev, specializations: JSON.stringify(updatedSpecs) }))
  }

  const addCertification = () => {
    if (!newCertification.trim()) return
    
    const currentCerts = formData.certifications ? JSON.parse(formData.certifications) : []
    const updatedCerts = [...currentCerts, newCertification.trim()]
    
    setFormData(prev => ({ ...prev, certifications: JSON.stringify(updatedCerts) }))
    setNewCertification('')
  }

  const removeCertification = (index: number) => {
    const currentCerts = formData.certifications ? JSON.parse(formData.certifications) : []
    const updatedCerts = currentCerts.filter((_: string, i: number) => i !== index)
    
    setFormData(prev => ({ ...prev, certifications: JSON.stringify(updatedCerts) }))
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      setMessage(null)

      // Update user profile in database
      const userRecord = await blink.db.users.list({
        where: { userId: user.id },
        limit: 1
      })

      if (userRecord.length > 0) {
        await blink.db.users.update(userRecord[0].id, {
          fullName: formData.fullName,
          userType: formData.userType,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          licenseNumber: formData.licenseNumber,
          specializations: formData.specializations,
          yearsExperience: formData.yearsExperience,
          education: formData.education,
          certifications: formData.certifications,
          availability: formData.availability,
          practiceName: formData.practiceName,
          practiceType: formData.practiceType,
          websiteUrl: formData.websiteUrl,
          establishedYear: formData.establishedYear,
          staffSize: formData.staffSize
        })
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...formData } : null)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })

    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Upload to storage
      const { publicUrl } = await blink.storage.upload(
        file,
        `avatars/${user?.id}`,
        { upsert: true }
      )

      // Update profile with new avatar URL
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }))
      
      // Save immediately
      if (user) {
        const userRecord = await blink.db.users.list({
          where: { userId: user.id },
          limit: 1
        })

        if (userRecord.length > 0) {
          await blink.db.users.update(userRecord[0].id, {
            avatarUrl: publicUrl
          })
        }

        setUser(prev => prev ? { ...prev, avatarUrl: publicUrl } : null)
        setMessage({ type: 'success', text: 'Avatar updated successfully!' })
      }

    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: 'Failed to upload avatar' })
    }
  }

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
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
              <p className="text-gray-600">Unable to load your profile. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const specializations = formData.specializations ? JSON.parse(formData.specializations) : []
  const certifications = formData.certifications ? JSON.parse(formData.certifications) : []

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-1">Manage your professional profile and preferences</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Overview</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={formData.avatarUrl} />
                      <AvatarFallback className="text-2xl">
                        {formData.fullName?.charAt(0) || formData.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {formData.fullName || 'Your Name'}
                  </h3>
                  <p className="text-gray-600 mb-2">{formData.email}</p>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Badge variant={formData.userType === 'practice' ? 'default' : 'secondary'}>
                      {formData.userType === 'practice' ? 'Practice' : 'Dentist'}
                    </Badge>
                    {formData.isVerified && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {formData.rating && formData.rating > 0 && (
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{formData.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">
                        ({formData.totalReviews} reviews)
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    {formData.location && (
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {formData.location}
                      </div>
                    )}
                    {formData.phone && (
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        {formData.phone}
                      </div>
                    )}
                    {formData.websiteUrl && (
                      <div className="flex items-center justify-center gap-2">
                        <Building className="w-4 h-4" />
                        <a href={formData.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="professional">Professional</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Update your basic profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={formData.fullName || ''}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            value={formData.email || ''}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={formData.location || ''}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="City, State"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio || ''}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={4}
                        />
                      </div>

                      {formData.userType === 'practice' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="practiceName">Practice Name</Label>
                              <Input
                                id="practiceName"
                                value={formData.practiceName || ''}
                                onChange={(e) => handleInputChange('practiceName', e.target.value)}
                                placeholder="Enter practice name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="practiceType">Practice Type</Label>
                              <Input
                                id="practiceType"
                                value={formData.practiceType || ''}
                                onChange={(e) => handleInputChange('practiceType', e.target.value)}
                                placeholder="General, Orthodontics, etc."
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="websiteUrl">Website URL</Label>
                              <Input
                                id="websiteUrl"
                                value={formData.websiteUrl || ''}
                                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                                placeholder="https://yourpractice.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="establishedYear">Established Year</Label>
                              <Input
                                id="establishedYear"
                                type="number"
                                value={formData.establishedYear || ''}
                                onChange={(e) => handleInputChange('establishedYear', parseInt(e.target.value))}
                                placeholder="2020"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="staffSize">Staff Size</Label>
                            <Input
                              id="staffSize"
                              value={formData.staffSize || ''}
                              onChange={(e) => handleInputChange('staffSize', e.target.value)}
                              placeholder="1-5, 6-10, 11-25, etc."
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="professional" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Professional Information</CardTitle>
                      <CardDescription>
                        {formData.userType === 'practice' 
                          ? 'Manage your practice details and requirements'
                          : 'Update your credentials and professional details'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.userType === 'dentist' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="licenseNumber">License Number</Label>
                              <Input
                                id="licenseNumber"
                                value={formData.licenseNumber || ''}
                                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                                placeholder="Enter your license number"
                              />
                            </div>
                            <div>
                              <Label htmlFor="yearsExperience">Years of Experience</Label>
                              <Input
                                id="yearsExperience"
                                type="number"
                                value={formData.yearsExperience || ''}
                                onChange={(e) => handleInputChange('yearsExperience', parseInt(e.target.value))}
                                placeholder="5"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="education">Education</Label>
                            <Textarea
                              id="education"
                              value={formData.education || ''}
                              onChange={(e) => handleInputChange('education', e.target.value)}
                              placeholder="DDS from University of California, San Francisco (2018)"
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label>Specializations</Label>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={newSpecialization}
                                  onChange={(e) => setNewSpecialization(e.target.value)}
                                  placeholder="Add specialization"
                                  onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                                />
                                <Button type="button" onClick={addSpecialization} size="sm">
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {specializations.map((spec: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {spec}
                                    <button
                                      onClick={() => removeSpecialization(index)}
                                      className="ml-1 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label>Certifications</Label>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={newCertification}
                                  onChange={(e) => setNewCertification(e.target.value)}
                                  placeholder="Add certification"
                                  onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                                />
                                <Button type="button" onClick={addCertification} size="sm">
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {certifications.map((cert: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {cert}
                                    <button
                                      onClick={() => removeCertification(index)}
                                      className="ml-1 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferences</CardTitle>
                      <CardDescription>
                        Set your availability and notification preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.userType === 'dentist' && (
                        <div>
                          <Label htmlFor="availability">Availability</Label>
                          <Textarea
                            id="availability"
                            value={formData.availability || ''}
                            onChange={(e) => handleInputChange('availability', e.target.value)}
                            placeholder="Monday-Friday 9AM-5PM, Weekends available for emergencies"
                            rows={3}
                          />
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        <p className="mb-2">Email notifications are automatically enabled for:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>New job applications (for practices)</li>
                          <li>Application status updates (for dentists)</li>
                          <li>New messages</li>
                          <li>Job recommendations</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}