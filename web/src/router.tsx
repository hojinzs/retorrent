import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { DownloadsPage } from './pages/DownloadsPage'
import Login from './pages/Login'
import Preferences from './pages/Preferences'
import { Tabs, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Button } from '@shared/components/ui/button'
import { LogOut } from 'lucide-react'

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="dark">
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <div className="font-bold">Transmission WebUI</div>
          <Link to="/login" className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </Link>
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

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
    </>
  ),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  beforeLoad: () => {
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
  loginRoute,
  appRoute.addChildren([indexRoute, downloadsRoute, prefsRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />
}
