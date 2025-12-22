import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './routes/AuthProvider'
import MainLayout from './layouts/MainLayout'

import Login from './pages/Login'
import Classes from './pages/Classes'
import Classroom from './pages/Classroom'
import Assignments from './pages/Assignments'
import NotFound from './pages/NotFound'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {user && (
        <Route
          path="/"
          element={
            <MainLayout>
              <Classes />
            </MainLayout>
          }
        />
      )}

      <Route
        path="/classes"
        element={
          user ? (
            <MainLayout>
              <Classes />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/classes/:id"
        element={
          user ? (
            <MainLayout>
              <Classroom />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/assignments"
        element={
          user ? (
            <MainLayout>
              <Assignments />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
