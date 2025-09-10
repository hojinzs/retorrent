export type Torrent = {
  id: string
  name: string
  status: 'downloading' | 'seeding' | 'paused' | 'error' | 'checking' | 'completed' | 'queued'
  progress: number // 0..1
  size: string
  ratio: number
}
