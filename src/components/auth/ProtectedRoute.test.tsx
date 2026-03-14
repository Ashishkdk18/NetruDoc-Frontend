import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProtectedRoute from './ProtectedRoute'

type AuthState = {
  isAuthenticated: boolean
  loading: boolean
  user: { role: 'patient' | 'doctor' | 'admin' } | null
}

let mockAuthState: AuthState

vi.mock('react-redux', () => ({
  useSelector: (selector: any) =>
    selector({
      auth: mockAuthState,
    }),
}))

vi.mock('react-router-dom', () => ({
  // Instead of rendering, we return a plain object so we can assert on it
  Navigate: (props: any) => ({ component: 'Navigate', ...props }),
  useLocation: () => ({ pathname: '/dashboard' }),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuthState = {
      isAuthenticated: false,
      loading: false,
      user: null,
    }
  })

  it('redirects unauthenticated users to /login', () => {
    mockAuthState = {
      isAuthenticated: false,
      loading: false,
      user: null,
    }

    const element = (ProtectedRoute as any)({ children: <div>Secret</div> })

    expect(element.component).toBe('Navigate')
    expect(element.to).toBe('/login')
  })

  it('shows children when authenticated and no role restriction', () => {
    mockAuthState = {
      isAuthenticated: true,
      loading: false,
      user: { role: 'patient' },
    }

    const element = (ProtectedRoute as any)({ children: <div>Dashboard</div> })

    // When access is allowed, it should render the children (React fragment)
    expect(element.props.children.props.children).toBe('Dashboard')
  })

  it('redirects to role-specific dashboard when role is not allowed', () => {
    mockAuthState = {
      isAuthenticated: true,
      loading: false,
      user: { role: 'doctor' },
    }

    const element = (ProtectedRoute as any)({
      roles: ['admin'], // doctor not allowed
      children: <div>Admin Only</div>,
    })

    expect(element.component).toBe('Navigate')
    expect(element.to).toBe('/doctor/dashboard')
  })

  it('redirects doctor from generic /dashboard to /doctor/dashboard', () => {
    mockAuthState = {
      isAuthenticated: true,
      loading: false,
      user: { role: 'doctor' },
    }

    const element = (ProtectedRoute as any)({
      children: <div>Generic Dashboard</div>,
    })

    expect(element.component).toBe('Navigate')
    expect(element.to).toBe('/doctor/dashboard')
  })
})