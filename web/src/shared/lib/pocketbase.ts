import PocketBase from 'pocketbase'

// Initialize PocketBase client with explicit URL
// Use current origin to ensure proper WebSocket connection
const pb = new PocketBase(window.location.origin)

// Disable auto cancellation to prevent request cancellation
pb.autoCancellation(false)

console.log('[PocketBase] Initialized with URL:', window.location.origin)
console.log('[PocketBase] Auth store:', pb.authStore.record ? 'Authenticated' : 'Not authenticated')
console.log('[PocketBase] Auth token:', pb.authStore.token ? 'Present' : 'Missing')

// Log auth changes
pb.authStore.onChange((token, record) => {
  console.log('[PocketBase] Auth changed:', {
    authenticated: !!record,
    userId: record?.id,
    hasToken: !!token
  })
})

export { pb }
export default pb