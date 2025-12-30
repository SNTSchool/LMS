import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Classes from './pages/Classes'
import Classroom from './pages/Classroom'
import Assignments from './pages/Assignments'
import AssignmentDetail from './pages/AssignmentDetail'
import Reports from './pages/Reports'
import { useAuth } from './routes/AuthProvider'
import ProtectedRoute from './routes/ProtectedRoute'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
      <Route path="/classes/:id" element={<ProtectedRoute><Classroom /></ProtectedRoute>} />

      <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
      <Route path="/assignments/:classId/:assignmentId" element={<ProtectedRoute><AssignmentDetail /></ProtectedRoute>} />

      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to={user ? '/classes' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/classes' : '/login'} replace />} />
    </Routes>
  )
}
