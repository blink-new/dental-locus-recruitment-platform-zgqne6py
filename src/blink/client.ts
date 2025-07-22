import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'dental-locus-recruitment-platform-zgqne6py',
  authRequired: true
})

// Disable analytics temporarily to prevent network errors
if (blink.analytics && blink.analytics.disable) {
  blink.analytics.disable()
}

// Add global error handler for any remaining network issues
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'BlinkNetworkError' && event.reason?.message?.includes('analytics')) {
      // Silently handle analytics errors
      event.preventDefault()
      console.warn('Analytics temporarily unavailable:', event.reason.message)
    }
  })
}

export default blink