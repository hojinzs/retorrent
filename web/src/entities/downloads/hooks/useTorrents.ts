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
    // Load initial data
    loadTorrents()

    // Subscribe to real-time updates
    const unsubscribe = pb.collection('torrents').subscribe('*', (e) => {
      const record = e.record as unknown as Torrent
      
      if (e.action === 'create') {
        setTorrents(prev => [record, ...prev])
      } else if (e.action === 'update') {
        setTorrents(prev => prev.map(t => t.id === record.id ? record : t))
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
      
      // Data will be updated via real-time subscription
    } catch (err) {
      console.error('Failed to force sync:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync torrents')
    }
  }, [])

  // Control torrent (start/stop/remove)
  const controlTorrent = useCallback(async (transmissionId: number, action: 'start' | 'stop' | 'remove') => {
    try {
      const response = await fetch(`/api/torrents/${transmissionId}/action`, {
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
    }
  }, [forceSync])

  return {
    torrents,
    isLoading,
    error,
    refetch: loadTorrents,
    forceSync,
    controlTorrent,
  }
}