import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type UserRole = 'admin' | 'user'

export interface UserRecord {
  id: string
  name: string
  email: string
  role: UserRole
  verified: boolean
  emailVisibility: boolean
  created: string
  updated: string
}

interface UsersResponse {
  users: UserRecord[]
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: UserRole
  verified?: boolean
  emailVisibility?: boolean
}

export interface UpdateUserRequest {
  id: string
  data: {
    name?: string
    email?: string
    password?: string
    role?: UserRole
    verified?: boolean
    emailVisibility?: boolean
  }
}

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  detail: (id: string) => [...usersKeys.all, 'detail', id] as const,
}

async function getUsers(): Promise<UsersResponse> {
  const response = await fetch('/api/users')

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch users')
  }

  return response.json()
}

async function createUser(payload: CreateUserRequest): Promise<UserRecord> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create user')
  }

  const data = await response.json()
  return data.user as UserRecord
}

async function updateUser({ id, data }: UpdateUserRequest): Promise<UserRecord> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to update user')
  }

  const payload = await response.json()
  return payload.user as UserRecord
}

export function useUsers() {
  return useQuery({
    queryKey: usersKeys.lists(),
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(data.id) })
    },
  })
}
