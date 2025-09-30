import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Checkbox } from '@shared/components/ui/checkbox'
import { Badge } from '@shared/components/ui/badge'
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  type UserRecord,
  type UserRole,
  type UpdateUserRequest,
} from '@shared/api/users'
import { useIsMobile } from '@shared/hooks/use-mobile'

interface UserFormSubmit {
  username: string
  email: string
  role: UserRole
  password?: string
  verified: boolean
  emailVisibility: boolean
}

interface UserFormDialogProps {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: Partial<UserRecord>
  onSubmit: (values: UserFormSubmit) => Promise<void>
  isSubmitting: boolean
}

function UserFormDialog({ mode, open, onOpenChange, initialValues, onSubmit, isSubmitting }: UserFormDialogProps) {
  const [formState, setFormState] = useState({
    username: initialValues?.username ?? '',
    email: initialValues?.email ?? '',
    role: (initialValues?.role ?? 'user') as UserRole,
    password: '',
    confirmPassword: '',
    verified: initialValues?.verified ?? false,
    emailVisibility: initialValues?.emailVisibility ?? false,
  })
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFormState({
        username: initialValues?.username ?? '',
        email: initialValues?.email ?? '',
        role: (initialValues?.role ?? 'user') as UserRole,
        password: '',
        confirmPassword: '',
        verified: initialValues?.verified ?? false,
        emailVisibility: initialValues?.emailVisibility ?? false,
      })
      setFormError(null)
    }
  }, [open, initialValues])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!formState.username.trim() || !formState.email.trim()) {
      setFormError('Username and email are required.')
      return
    }

    if (mode === 'create' && !formState.password.trim()) {
      setFormError('Password is required for new users.')
      return
    }

    if (formState.password !== formState.confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    try {
      await onSubmit({
        username: formState.username.trim(),
        email: formState.email.trim(),
        role: formState.role,
        password: formState.password.trim() ? formState.password.trim() : undefined,
        verified: formState.verified,
        emailVisibility: formState.emailVisibility,
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to submit form')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create user' : 'Edit user'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new account that can sign in to Retorrent.'
              : 'Update user details, or set a new password.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formState.username}
                onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="jane.doe"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="jane@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formState.role}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, role: value as UserRole }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="role" className="bg-input border-border">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formState.password}
                onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                placeholder={mode === 'create' ? 'Enter a secure password' : 'Leave blank to keep current password'}
                disabled={isSubmitting}
              />
              <Input
                id="confirmPassword"
                type="password"
                value={formState.confirmPassword}
                onChange={(event) => setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                placeholder={mode === 'create' ? 'Confirm password' : 'Confirm new password'}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={formState.verified}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, verified: !!checked }))
                }
                disabled={isSubmitting}
              />
              <Label htmlFor="verified" className="text-sm">Verified email</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailVisibility"
                checked={formState.emailVisibility}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, emailVisibility: !!checked }))
                }
                disabled={isSubmitting}
              />
              <Label htmlFor="emailVisibility" className="text-sm">Show email to other users</Label>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create user' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export default function UsersPage() {
  const { data, isLoading, error, refetch } = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const isMobile = useIsMobile()

  const users = useMemo(() => data?.users ?? [], [data])

  const handleCreateSubmit = async (values: UserFormSubmit) => {
    if (!values.password) {
      throw new Error('Password is required to create a user.')
    }

    await createUserMutation.mutateAsync({
      username: values.username,
      email: values.email,
      password: values.password,
      role: values.role,
      verified: values.verified,
      emailVisibility: values.emailVisibility,
    })

    setCreateOpen(false)
  }

  const handleEditSubmit = async (values: UserFormSubmit) => {
    if (!editingUser) {
      return
    }

    const payload: UpdateUserRequest = {
      id: editingUser.id,
      data: {
        username: values.username,
        email: values.email,
        role: values.role,
        verified: values.verified,
        emailVisibility: values.emailVisibility,
      },
    }

    if (values.password) {
      payload.data.password = values.password
    }

    await updateUserMutation.mutateAsync(payload)
    setEditOpen(false)
    setEditingUser(null)
  }

  const handleEditClick = (user: UserRecord) => {
    setEditingUser(user)
    setEditOpen(true)
  }

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open)
    if (!open) {
      setEditingUser(null)
    }
  }

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'overflow-auto' : 'h-full'}`}>
      <div className={`${isMobile ? 'p-4' : 'px-8 py-6'} border-b border-border flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage application accounts and permissions.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className={isMobile ? 'self-start' : ''}>
          <Plus className="mr-2 h-4 w-4" />
          New user
        </Button>
      </div>

      <div className={`flex-1 ${isMobile ? 'overflow-auto' : 'overflow-auto'}`}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading users...
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-center">
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Failed to load users.'}</p>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-2 text-center text-muted-foreground">
            <p className="text-sm">No users found.</p>
            <p className="text-xs">Create your first account to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="hidden md:grid grid-cols-[2fr,2fr,1fr,1fr,1.5fr,auto] gap-4 border-b border-border/60 px-8 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Updated</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="hidden md:flex md:flex-col">
              {users.map((user) => (
                <div key={user.id} className="grid grid-cols-[2fr,2fr,1fr,1fr,1.5fr,auto] items-center gap-4 border-b border-border/60 px-8 py-4 last:border-b-0">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                  </div>
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.emailVisibility ? 'Visible to other users' : 'Hidden from other users'}</p>
                  </div>
                  <div>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={user.verified ? 'default' : 'outline'}>
                      {user.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTimestamp(user.updated)}
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:hidden flex flex-col divide-y divide-border/60">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full text-left px-4 py-4 active:bg-muted/60"
                  onClick={() => handleEditClick(user)}
                >
                  <p className="text-sm font-medium">
                    ({user.verified ? 'Verified' : 'Pending'}) {user.username}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground capitalize">{user.role}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <UserFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateSubmit}
        isSubmitting={createUserMutation.isPending}
      />

      <UserFormDialog
        mode="edit"
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        initialValues={editingUser ?? undefined}
        onSubmit={handleEditSubmit}
        isSubmitting={updateUserMutation.isPending}
      />
    </div>
  )
}
