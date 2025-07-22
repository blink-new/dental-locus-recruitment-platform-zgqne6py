import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const Applications = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>
                Track your job applications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This page will show all job applications and their current status.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Applications