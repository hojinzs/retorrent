import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouterProvider } from './router'
import { AuthProvider } from '@shared/contexts/AuthContext'
import { ThemeProvider } from '@shared/contexts/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <ThemeProvider>
      <AppRouterProvider />
    </ThemeProvider>
  </AuthProvider>
)
