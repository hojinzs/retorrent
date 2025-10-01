import { useEffect, useState, useCallback } from 'react'
import pb from '@shared/lib/pocketbase'
import type { Torrent } from '../model'

type TorrentWorkerMessage =
  | { type: 'TORRENTS'; payload: Torrent[] }
  | { type: 'ERROR'; payload: string }

const WORKER_POLL_INTERVAL = 15_000

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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return
    }

    const worker = new Worker(new URL('../workers/torrentSyncWorker.ts', import.meta.url), {
      type: 'module'
    })

    const getAuthCookie = () => {
      if (typeof pb.authStore.exportToCookie === 'function') {
        return pb.authStore.exportToCookie({ httpOnly: false })
      }

      return ''
    }

    const handleWorkerMessage = (event: MessageEvent<TorrentWorkerMessage>) => {
      const message = event.data

      if (message.type === 'TORRENTS') {
        setTorrents(message.payload)
        setError(null)
      } else if (message.type === 'ERROR') {
        setError(message.payload)
      }
    }

    worker.addEventListener('message', handleWorkerMessage)

    const baseUrl = pb.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')

    worker.postMessage({
      type: 'INIT',
      payload: {
        baseUrl,
        authCookie: getAuthCookie(),
        interval: WORKER_POLL_INTERVAL
      }
    })

    worker.postMessage({ type: 'START' })

    const unsubscribeAuth = pb.authStore.onChange(() => {
      worker.postMessage({
        type: 'AUTH_UPDATE',
        payload: { authCookie: getAuthCookie() }
      })
    }, false)

    return () => {
      unsubscribeAuth()
      worker.postMessage({ type: 'STOP' })
      worker.removeEventListener('message', handleWorkerMessage)
      worker.terminate()
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
        // If a torrent gets marked as removed, drop it from the list immediately
        if ((record as any).status === 'removed') {
          setTorrents(prev => prev.filter(t => t.id !== record.id))
        } else {
          setTorrents(prev => prev.map(t => t.id === record.id ? record : t))
        }
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