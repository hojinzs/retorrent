import { createContext, useContext, type ReactNode } from 'react'

export type SyncStatusTone = 'online' | 'error' | 'idle'

type SyncControls = {
  onSync?: () => void | Promise<void>
  statusLabel?: string
  helperText?: string | null
  tone?: SyncStatusTone
}

type AppShellContextValue = {
  isMobile: boolean
  registerSyncControls: (controls: SyncControls | null) => void
  syncControls: SyncControls | null
}

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined)

export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within an AppShell provider')
  }
  return context
}

export function AppShellProvider({
  value,
  children,
}: {
  value: AppShellContextValue
  children: ReactNode
}) {
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}

export type { SyncControls }
