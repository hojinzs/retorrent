export type TorrentStatus = 
  | 'stopped'
  | 'checkWait' 
  | 'check'
  | 'downloadWait'
  | 'download'
  | 'seedWait'
  | 'seed'
  | 'removed'

export type Torrent = {
  id: string
  transmissionId: number
  name: string
  hash: string
  status: TorrentStatus
  percentDone: number
  sizeWhenDone: number
  totalSize: number
  rateDownload: number
  rateUpload: number
  uploadRatio: number
  eta: number
  downloadedEver: number
  uploadedEver: number
  addedDate: string
  doneDate?: string
  error?: string
  errorString?: string
  transmissionData?: any
  user?: string
  created: string
  updated: string
}

// Legacy type for backward compatibility
export type { Torrent as TorrentData }
