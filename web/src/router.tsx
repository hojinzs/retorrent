import {
  Link,
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
import { Tabs, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Button } from '@shared/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@shared/contexts/AuthContext'
import { useAdminExists } from '@shared/hooks/useAdminExists'
import { LoadingSpinner } from '@shared/components/LoadingSpinner'

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="dark">
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <div className="font-bold">Transmission WebUI</div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </header>

        <div className="mx-auto max-w-5xl px-4">
          <Tabs value={pathname} className="pt-2">
            <TabsList>
              <TabsTrigger value="/downloads" asChild>
                <Link to="/downloads">Downloads</Link>
              </TabsTrigger>
              <TabsTrigger value="/preferences" asChild>
                <Link to="/preferences">Preferences</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <main className="py-6">
            <Outlet />
          </main>
        </div>
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
    // If no admin exists, redirect to setup
    if (context.adminExists?.adminExists === false) {
      throw redirect({ to: '/setup' })
    }
    // If user is not authenticated, redirect to login
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
  beforeLoad: ({ context }) => {
    // If no admin exists, redirect to setup
    if (context.adminExists?.adminExists === false) {
      throw redirect({ to: '/setup' })
    }
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
