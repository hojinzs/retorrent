/// <reference lib="webworker" />

import PocketBase from 'pocketbase'
import type { Torrent } from '../model'

const ctx = self as DedicatedWorkerGlobalScope

interface InitMessage {
  type: 'INIT'
  payload: {
    baseUrl: string
    authCookie?: string
    interval?: number
  }
}

interface StartMessage {
  type: 'START'
  payload?: {
    interval?: number
  }
}

interface StopMessage {
  type: 'STOP'
}

interface AuthUpdateMessage {
  type: 'AUTH_UPDATE'
  payload: {
    authCookie?: string
  }
}

type IncomingMessage = InitMessage | StartMessage | StopMessage | AuthUpdateMessage

const DEFAULT_POLL_INTERVAL = 15_000

let pb: PocketBase | null = null
let pollTimer: ReturnType<typeof setInterval> | undefined
let pollInterval = DEFAULT_POLL_INTERVAL

const fetchTorrents = async () => {
  if (!pb) return

  try {
    const records = await pb.collection('torrents').getFullList<Torrent>({
      sort: '-updated',
      filter: 'status != "removed"'
    })

    ctx.postMessage({ type: 'TORRENTS', payload: records })
  } catch (error) {
    console.error('[torrentSyncWorker] Failed to fetch torrents', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch torrents'
    ctx.postMessage({ type: 'ERROR', payload: message })
  }
}

const clearPoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

const startPoll = () => {
  clearPoll()
  pollTimer = setInterval(fetchTorrents, pollInterval)
  void fetchTorrents()
}

ctx.addEventListener('message', (event: MessageEvent<IncomingMessage>) => {
  const { data } = event

  switch (data.type) {
    case 'INIT': {
      if (!pb || pb.baseURL !== data.payload.baseUrl) {
        pb = new PocketBase(data.payload.baseUrl)
      }

      pollInterval = data.payload.interval ?? DEFAULT_POLL_INTERVAL

      if (data.payload.authCookie && data.payload.authCookie.length > 0) {
        pb.authStore.loadFromCookie(data.payload.authCookie)
      } else {
        pb.authStore.clear()
      }
      break
    }

    case 'START': {
      if (data.payload?.interval) {
        pollInterval = data.payload.interval
      }
      if (pb) {
        startPoll()
      }
      break
    }

    case 'STOP': {
      clearPoll()
      break
    }

    case 'AUTH_UPDATE': {
      if (!pb) {
        break
      }

      const authCookie = data.payload.authCookie
      if (authCookie && authCookie.length > 0) {
        pb.authStore.loadFromCookie(authCookie)
      } else {
        pb.authStore.clear()
      }

      break
    }

    default:
      break
  }
})

ctx.addEventListener('close', () => {
  clearPoll()
})
