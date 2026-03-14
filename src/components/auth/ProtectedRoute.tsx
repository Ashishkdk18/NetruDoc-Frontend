import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { Box, CircularProgress } from '@mui/material'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth)
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access
  if (roles && user && !roles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user.role === 'doctor') {
      return <Navigate to="/doctor/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  // If no explicit roles are given and this is the generic dashboard route,
  // send doctors to doctor dashboard and admins to admin dashboard; patients stay on /dashboard
  if (!roles && user && location.pathname === '/dashboard') {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
