import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import InstructorDashboard from './pages/InstructorDashboard'

import { useAuth } from './routes/AuthProvider'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'

import ClubsPage from './features/clubs/ClubList'

// Attendance (QR)
import TeacherSession from './features/attendance/TeacherSession'
import StudentScanner from './features/attendance/StudentScanner'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <Routes>

      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Student Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <StudentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Instructor Dashboard */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute>
            <Layout>
              <InstructorDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Clubs */}
      <Route
        path="/clubs"
        element={
          <ProtectedRoute>
            <Layout>
              <ClubsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Attendance - Instructor (Create QR) */}
      <Route
        path="/attendance/create"
        element={
          <ProtectedRoute>
            <Layout>
              <TeacherSession />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Attendance - Student (Scan QR) */}
      <Route
        path="/attendance/scan"
        element={
          <ProtectedRoute>
            <Layout>
              <StudentScanner />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? '/' : '/login'} replace />}
      />

    </Routes>
  )
}
