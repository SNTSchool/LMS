// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import InstructorDashboard from './pages/InstructorDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

import { useAuth } from './routes/AuthProvider'
import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './components/Layout'

import ClubsPage from './features/clubs/ClubList'

// Classroom
import ClassList from './features/classroom/ClassList'
import ClassDetail from './features/classroom/ClassDetail'

// Attendance
import TeacherSession from './features/attendance/TeacherSession'
import StudentScanner from './features/attendance/StudentScanner'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Home */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <StudentDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/attendance/scan" element={<AttendanceScan />} />


      {/* Instructor Dashboard */}
      <Route path="/instructor" element={
        <ProtectedRoute>
          <Layout>
            <InstructorDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <Layout>
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Classes list */}
      <Route path="/classes" element={
        <ProtectedRoute>
          <Layout>
            <ClassList />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Class detail (assignments + sessions) */}
      <Route path="/classes/:classId" element={
        <ProtectedRoute>
          <Layout>
            <ClassDetail />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Clubs */}
      <Route path="/clubs" element={
        <ProtectedRoute>
          <Layout>
            <ClubsPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Attendance - Instructor (Create QR) */}
      <Route path="/attendance/create" element={
        <ProtectedRoute>
          <Layout>
            <TeacherSession />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Attendance - Student (Scan QR) */}
      <Route path="/attendance/scan" element={
        <ProtectedRoute>
          <Layout>
            <StudentScanner />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Fallback: let browser/router handle */}
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}
