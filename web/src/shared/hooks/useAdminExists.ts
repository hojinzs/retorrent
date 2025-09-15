import { useState, useEffect } from 'react'

interface AdminExistsResult {
  adminExists: boolean | null  // null = loading, boolean = result
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAdminExists(): AdminExistsResult {
  const [adminExists, setAdminExists] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminExists = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/exists')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check admin status')
      }
      
      setAdminExists(data.adminExists)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setAdminExists(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminExists()
  }, [])

  const refetch = async () => {
    await fetchAdminExists()
  }

  return {
    adminExists,
    isLoading,
    error,
    refetch
  }
}