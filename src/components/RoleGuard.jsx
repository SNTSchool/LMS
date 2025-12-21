import { useAuth } from '../routes/AuthProvider'

export default function RoleGuard({ allow = [], children }) {
  const { userData, loading } = useAuth()

  if (loading) return null
  if (!userData) return null

  if (userData.role === 'admin') return children
  if (allow.includes(userData.role)) return children

  return null
}
