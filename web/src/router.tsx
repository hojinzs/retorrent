import {
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  useRouterState,
  useNavigate,
} from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadsPage } from './pages/DownloadsPage'
import Login from './pages/Login'
import InitialSetup from './pages/InitialSetup'
import Preferences from './pages/Preferences'
import { Button } from '@shared/components/ui/button'
import { Menu } from 'lucide-react'
import { useAuth } from '@shared/contexts/AuthContext'
import { useAdminExists } from '@shared/hooks/useAdminExists'
import { LoadingSpinner } from '@shared/components/LoadingSpinner'
import { AppSidebar } from './pages/components/AppSidebar'
import { cn } from '@shared/lib/utils'
import { AppShellProvider } from '@shared/contexts/AppShellContext'
import type { SyncControls } from '@shared/contexts/AppShellContext'

const PAGE_TITLES: Record<string, string> = {
  '/downloads': 'Downloads',
  '/preferences': 'Preferences',
}

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncControls, setSyncControls] = useState<SyncControls | null>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  const registerSyncControls = useCallback((controls: SyncControls | null) => {
    setSyncControls(controls)
  }, [])

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const activeTitle = useMemo(() => {
    if (pathname in PAGE_TITLES) return PAGE_TITLES[pathname]
    const entry = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))
    return entry?.[1] ?? 'Transmission'
  }, [pathname])

  const appShellValue = useMemo(
    () => ({
      isMobile,
      registerSyncControls,
      syncControls,
    }),
    [isMobile, registerSyncControls, syncControls]
  )

  return (
    <AppShellProvider value={appShellValue}>
      <div className={cn('relative min-h-screen w-full overflow-hidden', isDark && 'dark')}>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,139,34,0.12),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,_rgba(34,139,34,0.28),transparent_65%)]" />
        </div>

        <div className="flex min-h-screen text-foreground">
          <AppSidebar
            isDark={isDark}
            onThemeToggle={() => setIsDark((prev) => !prev)}
            activePath={pathname}
            onNavigate={(path) => navigate({ to: path })}
            isMobile={isMobile}
            isOpen={!isMobile || sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            userEmail={user?.email ?? user?.username ?? undefined}
            userName={user?.name ?? user?.username ?? null}
            syncControls={syncControls}
            onLogout={handleLogout}
          />

          <div className={cn('flex-1 min-w-0 flex flex-col px-4 sm:px-6', isMobile ? 'pt-16' : 'py-10')}>
            {isMobile && (
              <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-center border-b border-white/20 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
                <h3 className="text-base font-semibold">{activeTitle}</h3>
              </div>
            )}

            <main className="flex-1 min-h-0 pb-10">
              <Outlet />
            </main>
          </div>
        </div>

        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-6 left-6 z-40 h-12 w-12 rounded-full border border-white/40 bg-white/70 text-foreground shadow-lg backdrop-blur-xl hover:bg-white/80 dark:border-white/20 dark:bg-slate-900/70 dark:hover:bg-slate-900/80"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </div>
    </AppShellProvider>
  )
}

const rootRoute = createRootRouteWithContext<{
  auth: ReturnType<typeof useAuth>
  adminExists: ReturnType<typeof useAdminExists>
}>()({
  component: () => (
    <>
      <Outlet />
    </>
  ),
})

const initialSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/setup',
  component: InitialSetup,
  beforeLoad: ({ context }) => {
    console.log("context => ", context)
    // Only allow access if no admin exists
    if (context.adminExists?.adminExists === true) {
      throw redirect({ to: '/login' })
    }
    // If user is already authenticated, redirect to main app
    if (context.auth?.user) {
      throw redirect({ to: '/downloads' })
    }
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
  beforeLoad: ({ context }) => {

    console.log("context => ", context)
    // If no admin exists, redirect to setup
    if (context.adminExists?.adminExists === false) {
      throw redirect({ to: '/setup' })
    }
    // If user is already authenticated, redirect to main app
    if (context.auth?.user) {
      throw redirect({ to: '/downloads' })
    }
  },
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
  beforeLoad: ({ context, location }) => {

    console.log("Context => ", context)

    // Only handle authentication here; admin gating is handled by /login and /setup routes
    if (!context.auth?.user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      })
    }
  },
})

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  beforeLoad: () => {
    // Default to downloads as the app index
    throw redirect({ to: '/downloads' })
  },
})

const downloadsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/downloads',
  component: DownloadsPage,
})

const prefsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/preferences',
  component: Preferences,
})

const routeTree = rootRoute.addChildren([
  initialSetupRoute,
  loginRoute,
  appRoute.addChildren([indexRoute, downloadsRoute, prefsRoute]),
])

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    adminExists: undefined!,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouterProvider() {
  const auth = useAuth()
  const adminExists = useAdminExists()
  
  // Show loading spinner while checking admin status
  if (adminExists.isLoading) {
    return <LoadingSpinner />
  }
  
  // Show error if admin check failed
  if (adminExists.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{adminExists.error}</p>
          <button
            onClick={adminExists.refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  
  return <RouterProvider router={router} context={{ auth, adminExists }} />
}
