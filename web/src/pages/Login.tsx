import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Label } from "@shared/components/ui/label"
import { useAuth } from "@shared/contexts/AuthContext"
import { useState, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react"
import { useIsMobile } from "@shared/hooks/use-mobile"
import { useTheme } from "@shared/contexts/ThemeContext"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { theme } = useTheme()

  // Apply theme to document
  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await login(username, password)
      navigate({ to: "/" })
    } catch (err) {
      setError("Invalid username or password. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Glass morphism card */}
        <div className="backdrop-blur-glass glass-panel rounded-xl p-8 border border-border/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center">
              <LogIn className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Welcome to Retorrent</h1>
            <p className="caption text-muted-foreground">
              Sign in to access your torrent management dashboard
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="detail text-destructive">{error}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  className={`bg-input border-border text-foreground placeholder:text-muted-foreground ${
                    isMobile ? 'h-12' : 'h-11'
                  }`}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-12 ${
                      isMobile ? 'h-12' : 'h-11'
                    }`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full bg-green-600 hover:bg-green-700 text-white ${
                isMobile ? 'h-12' : 'h-11'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="detail text-muted-foreground">
              Make sure your Transmission daemon is running and accessible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
