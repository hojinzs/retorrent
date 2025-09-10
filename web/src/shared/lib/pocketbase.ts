import PocketBase from 'pocketbase'

// Initialize PocketBase client
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8080')

// Disable auto cancellation
pb.autoCancellation(false)

export { pb }
export default pb