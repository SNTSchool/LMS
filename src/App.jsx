import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Classes from './pages/Classes'
import Classroom from './pages/Classroom'
import ProtectedRoute from './routes/ProtectedRoute'
import { useAuth } from './routes/AuthProvider'

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return user
    ? <Navigate to="/classes" replace />
    : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* ⭐ MAIN ROOT */}
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <Classes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/classes/:id"
        element={
          <ProtectedRoute>
            <Classroom />
          </ProtectedRoute>
        }
      />

      {/* (optional) 404 */}
      <Route
        path="*"
        element={
          <Navigate to="/" replace />
        }
      />
    </Routes>
  )
}
