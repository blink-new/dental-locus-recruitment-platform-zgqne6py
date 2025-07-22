import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const DentistProfile = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Dentist Profile</CardTitle>
              <CardDescription>
                Manage your professional profile and credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This page will contain the dentist profile management interface.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DentistProfile