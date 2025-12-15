import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import InstructorDashboard from './pages/InstructorDashboard'
import { useAuth } from './routes/AuthProvider'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'
import ClubsPage from './features/clubs/ClubList'

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <StudentDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/instructor" element={
        <ProtectedRoute>
          <Layout>
            <InstructorDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/clubs" element={
        <ProtectedRoute>
          <Layout>
            <ClubsPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
    </Routes>
  )
}
