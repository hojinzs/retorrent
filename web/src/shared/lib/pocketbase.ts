import PocketBase from 'pocketbase'

// Initialize PocketBase client with explicit URL
// Use current origin to ensure proper WebSocket connection
const pb = new PocketBase(window.location.origin)

// Disable auto cancellation to prevent request cancellation
pb.autoCancellation(false)

console.log('[PocketBase] Initialized with URL:', window.location.origin)

export { pb }
export default pb