// API client functions for preferences
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types for preferences
export interface SessionSettings {
  'download-dir'?: string
  'incomplete-dir'?: string
  'incomplete-dir-enabled'?: boolean
  'start-added-torrents'?: boolean
  'peer-port'?: number
  'peer-port-random-on-start'?: boolean
  'port-forwarding-enabled'?: boolean
  'speed-limit-down'?: number
  'speed-limit-down-enabled'?: boolean
  'speed-limit-up'?: number
  'speed-limit-up-enabled'?: boolean
  'alt-speed-down'?: number
  'alt-speed-up'?: number
  'peer-limit-global'?: number
  'peer-limit-per-torrent'?: number
  encryption?: string
  'pex-enabled'?: boolean
  'dht-enabled'?: boolean
  'lpd-enabled'?: boolean
  seedRatioLimit?: number
  seedRatioLimited?: boolean
  'idle-seeding-limit'?: number
  'idle-seeding-limit-enabled'?: boolean
  'queue-stalled-minutes'?: number
  'rename-partial-files'?: boolean
}

export interface PreferencesResponse {
  success: boolean
  data: SessionSettings
}

export interface UpdatePreferencesRequest {
  settings: Partial<SessionSettings>
}

export interface UpdatePreferencesResponse {
  success: boolean
  message: string
}

// Query key factory
export const preferencesKeys = {
  all: ['preferences'] as const,
  settings: () => [...preferencesKeys.all, 'settings'] as const,
}

// API functions
async function getPreferences(): Promise<PreferencesResponse> {
  const response = await fetch('/api/preferences', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.statusText}`)
  }
  
  return response.json()
}

async function updatePreferences(settings: Partial<SessionSettings>): Promise<UpdatePreferencesResponse> {
  const response = await fetch('/api/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ settings }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Failed to update preferences: ${response.statusText}`)
  }
  
  return response.json()
}

// Hooks
export function usePreferences() {
  return useQuery({
    queryKey: preferencesKeys.settings(),
    queryFn: getPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (was cacheTime)
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      // Invalidate and refetch preferences after successful update
      queryClient.invalidateQueries({ queryKey: preferencesKeys.settings() })
    },
    onError: (error) => {
      console.error('Failed to update preferences:', error)
    },
  })
}