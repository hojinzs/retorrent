import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { AppRouterProvider } from './router'
import { AuthProvider } from '@shared/contexts/AuthContext'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { PreferencesProvider } from '@shared/contexts/PreferencesContext'

registerSW({
  immediate: true,
})

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <PreferencesProvider>
      <ThemeProvider>
        <AppRouterProvider />
      </ThemeProvider>
    </PreferencesProvider>
  </AuthProvider>
)
