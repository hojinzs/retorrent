import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { AppRouterProvider } from './router'
import { AuthProvider } from '@shared/contexts/AuthContext'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { QueryProvider } from '@shared/contexts/QueryContext'

registerSW({
  immediate: true,
})

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <AuthProvider>
      <ThemeProvider>
        <AppRouterProvider />
      </ThemeProvider>
    </AuthProvider>
  </QueryProvider>
)
