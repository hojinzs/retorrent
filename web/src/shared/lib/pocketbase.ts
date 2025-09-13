import PocketBase from 'pocketbase'

// Initialize PocketBase client
const pb = new PocketBase()

// Disable auto cancellation
pb.autoCancellation(false)

export { pb }
export default pb