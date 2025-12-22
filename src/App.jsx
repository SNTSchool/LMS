import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './routes/AuthProvider'

import Login from './pages/Login'
import Classes from './pages/Classes'
import Classroom from './pages/Classroom'
import NotFound from './pages/NotFound'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/classes"
        element={user ? <Classes /> : <Navigate to="/login" />}
      />

      <Route
        path="/classes/:id"
        element={user ? <Classroom /> : <Navigate to="/login" />}
      />

      <Route
        path="/"
        element={<Navigate to={user ? '/classes' : '/login'} />}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
