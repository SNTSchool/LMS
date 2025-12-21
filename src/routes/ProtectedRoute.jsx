import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function ProtectedRoute({ children, allow }) {
  const { userData, loading } = useAuth()

  if (loading) return null
  if (!userData) return <Navigate to="/login" />

  if (userData.role === 'admin') return children
  if (allow && !allow.includes(userData.role)) {
    return <Navigate to="/classes" />
  }

  return children
}
