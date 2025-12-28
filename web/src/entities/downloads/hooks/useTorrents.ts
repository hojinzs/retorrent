import { useEffect, useState, useCallback } from 'react'
import pb from '@shared/lib/pocketbase'
import type { Torrent } from '../model'

export function useTorrents() {
  const [torrents, setTorrents] = useState<Torrent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  const loadTorrents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const records = await pb.collection('torrents').getFullList<Torrent>({
        sort: '-updated',
        filter: 'status != "removed"'
      })
      
      setTorrents(records)
    } catch (err) {
      console.error('Failed to load torrents:', err)
      setError(err instanceof Error ? err.message : 'Failed to load torrents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const init = async () => {
      try {
        // Load initial data
        console.log('[useTorrents] Loading initial torrents...')
        await loadTorrents()
        console.log('[useTorrents] Initial torrents loaded')

        // Subscribe to real-time updates
        console.log('[useTorrents] Setting up real-time subscription...')
        unsubscribe = await pb.collection('torrents').subscribe('*', (e) => {
          console.log('[useTorrents] Received real-time event:', e.action, e.record)
          const record = e.record as unknown as Torrent

          if (e.action === 'create') {
            console.log('[useTorrents] Adding new torrent to list:', record.name)
            setTorrents(prev => [record, ...prev])
          } else if (e.action === 'update') {
            console.log('[useTorrents] Updating torrent:', record.name, 'status:', record.status)
            // If a torrent gets marked as removed, drop it from the list immediately
            if ((record as any).status === 'removed') {
              console.log('[useTorrents] Removing torrent from list:', record.name)
              setTorrents(prev => prev.filter(t => t.id !== record.id))
            } else {
              setTorrents(prev => prev.map(t => t.id === record.id ? record : t))
            }
          } else if (e.action === 'delete') {
            console.log('[useTorrents] Deleting torrent from list:', record.id)
            setTorrents(prev => prev.filter(t => t.id !== record.id))
          }
        })
        console.log('[useTorrents] Real-time subscription established successfully')
      } catch (err) {
        console.error('[useTorrents] Failed to setup subscription:', err)
      }
    }

    init()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        console.log('[useTorrents] Cleaning up subscription')
        unsubscribe()
      }
    }
  }, [loadTorrents])

  // Force sync with Transmission
  const forceSync = useCallback(async () => {
    try {
      console.log('[useTorrents] Force syncing...')
      const response = await fetch('/api/torrents/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to sync torrents')
      }

      console.log('[useTorrents] Force sync completed, reloading torrents...')
      // Reload data to ensure UI is updated
      await loadTorrents()
      console.log('[useTorrents] Torrents reloaded after sync')
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