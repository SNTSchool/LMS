

import React from 'react'

import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Classes from './pages/Classes'
import CreateClass from './pages/CreateClass'
import Login from './pages/Login'
import { useAuth } from './routes/AuthProvider'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/classes" />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/create" element={<CreateClass />} />
        </Routes>
      </main>
    </div>
  )
}