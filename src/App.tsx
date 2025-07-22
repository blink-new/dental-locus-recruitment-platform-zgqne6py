import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import LandingPage from '@/pages/LandingPage'
import JobListings from '@/pages/JobListings'
import JobDetails from '@/pages/JobDetails'
import PostJob from '@/pages/PostJob'
import Profile from '@/pages/Profile'
import Dashboard from '@/pages/Dashboard'
import Applications from '@/pages/Applications'
import Messages from '@/pages/Messages'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App