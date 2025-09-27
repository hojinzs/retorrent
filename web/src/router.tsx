import {
  Outlet,
  RouterProvider,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { DownloadsPage } from './pages/DownloadsPage'
import Login from './pages/Login'
import InitialSetup from './pages/InitialSetup'
import Preferences from './pages/Preferences'
import { Button } from '@shared/components/ui/button'
import { Menu } from 'lucide-react'
import { useAuth } from '@shared/contexts/AuthContext'
import { useAdminExists } from '@shared/hooks/useAdminExists'
import { LoadingSpinner } from '@shared/components/LoadingSpinner'
import { Sidebar } from '@shared/components/Sidebar'
import { useTheme } from '@shared/contexts/ThemeContext'
import { useIsMobile } from '@shared/hooks/use-mobile'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { useState } from 'react'

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleThemeToggle = () => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setTheme(isDark ? 'light' : 'dark')
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="h-lvh w-full bg-background text-foreground flex overflow-hidden">
      {/* Mobile FAB Menu Button */}
      {isMobile && (
        <Button
          className="fixed bottom-6 left-6 z-40 size-16 rounded-full shadow-lg bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border border-border hover:bg-white/75 dark:hover:bg-neutral-700/50 transition-color duration-500"
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <Sidebar
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        activePath={pathname}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
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
  
  return (
    <ThemeProvider>
      <RouterProvider router={router} context={{ auth, adminExists }} />
    </ThemeProvider>
  )
}
