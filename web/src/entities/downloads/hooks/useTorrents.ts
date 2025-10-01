import { useEffect, useState, useCallback } from 'react'
import type { RecordModel } from 'pocketbase'
import pb from '@shared/lib/pocketbase'
import type { Torrent } from '../model'

function normalizeTorrent(record: RecordModel | Torrent): Torrent {
  if ('export' in record && typeof record.export === 'function') {
    return record.export() as Torrent
  }

  return record as Torrent
}

function sortByUpdated(torrents: Torrent[]) {
  return [...torrents].sort((a, b) => {
    const aTime = new Date(a.updated).getTime()
    const bTime = new Date(b.updated).getTime()
    return bTime - aTime
  })
}

export function useTorrents() {
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  const loadTorrents = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    try {
      if (!silent) {
        setIsLoading(true)
      }
      setError(null)

      const records = await pb.collection('torrents').getFullList<Torrent>({
        sort: '-updated',
        filter: 'status != "removed"'
      })

      setTorrents(sortByUpdated(records.map(normalizeTorrent)))
    } catch (err) {
      console.error('Failed to load torrents:', err)
      setError(err instanceof Error ? err.message : 'Failed to load torrents')
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    // Load initial data
    loadTorrents()

    // Subscribe to real-time updates
    const unsubscribe = pb.collection('torrents').subscribe('*', (e) => {
      const record = normalizeTorrent(e.record as RecordModel)

      if (record.status === 'removed') {
        setTorrents(prev => prev.filter(t => t.id !== record.id))
        return
      }

      if (e.action === 'create') {
        setTorrents(prev => sortByUpdated([record, ...prev]))
      } else if (e.action === 'update') {
        setTorrents(prev => {
          const exists = prev.some(t => t.id === record.id)
          if (!exists) {
            return sortByUpdated([record, ...prev])
          }

          return sortByUpdated(prev.map(t => (t.id === record.id ? record : t)))
        })
      } else if (e.action === 'delete') {
        setTorrents(prev => prev.filter(t => t.id !== record.id))
      }
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe?.then(unsub => unsub?.())
    }
  }, [loadTorrents])

  // Force sync with Transmission
  const forceSync = useCallback(async () => {
    try {
      const response = await fetch('/api/torrents/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync torrents')
      }
      
      // Refresh torrents after sync to ensure UI stays in sync
      await loadTorrents({ silent: true })
    } catch (err) {
      console.error('Failed to force sync:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync torrents')
    }
  }, [loadTorrents])

  // Control torrent (start/stop/remove)
  const controlTorrent = useCallback(async (id: string, action: 'start' | 'stop' | 'remove') => {
    try {
      const response = await fetch(`/api/torrents/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} torrent`)
      }
      
      // Force sync to update data
      await forceSync()
    } catch (err) {
      console.error(`Failed to ${action} torrent:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${action} torrent`)
      throw err // Re-throw for UI error handling
    }
  }, [forceSync])

  // Add torrent via magnet link or file
  const addTorrent = useCallback(async (
    torrent: string, 
    options?: { downloadDir?: string; autoStart?: boolean }
  ) => {
    try {
      const response = await fetch('/api/torrents/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          torrent,
          downloadDir: options?.downloadDir,
          autoStart: options?.autoStart,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add torrent')
      }
      
      const result = await response.json()
      
      // Force sync to update data
      await forceSync()
      
      return result
    } catch (err) {
      console.error('Failed to add torrent:', err)
      setError(err instanceof Error ? err.message : 'Failed to add torrent')
      throw err // Re-throw for UI error handling
    }
  }, [forceSync])

  // Remove multiple torrents
  const removeTorrents = useCallback(async (
    ids: number[],
    deleteLocalData = false
  ) => {
    try {
      const response = await fetch('/api/torrents/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids,
          deleteLocalData,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove torrents')
      }
      
      const result = await response.json()
      
      // Force sync to update data
      await forceSync()
      
      return result
    } catch (err) {
      console.error('Failed to remove torrents:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove torrents')
      throw err // Re-throw for UI error handling
    }
  }, [forceSync])

  return {
    torrents,
    isLoading,
    error,
    refetch: loadTorrents,
    forceSync,
    controlTorrent,
    addTorrent,
    removeTorrents,
  }
}