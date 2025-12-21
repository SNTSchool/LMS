// src/components/Sidebar.jsx
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Upload,
  Users,
  Shield,
  LogOut
} from 'lucide-react'
import { useAuth } from '../routes/AuthProvider'

export default function Sidebar() {
  const { userData, logout } = useAuth()
  const navigate = useNavigate()

  const role = userData?.role

  const linkClass =
    'flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100'

  return (
    <aside className="w-64 h-screen border-r bg-white flex flex-col">
      {/* ===== Header ===== */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-lg font-bold">
          Learning Management System
        </h1>
        <p className="text-xs text-gray-500">
          {userData?.email}
        </p>
      </div>

      {/* ===== Navigation ===== */}
      <nav className="flex-1 p-3 space-y-1">
        <NavLink to="/" className={linkClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/classes" className={linkClass}>
          <BookOpen size={18} />
          Classes
        </NavLink>

        <NavLink to="/assignments" className={linkClass}>
          <ClipboardList size={18} />
          Assignments
        </NavLink>

        <NavLink to="/submissions" className={linkClass}>
          <Upload size={18} />
          Submissions
        </NavLink>

        {/* ===== Teacher + Admin ===== */}
        {(role === 'teacher' || role === 'admin') && (
          <NavLink to="/people" className={linkClass}>
            <Users size={18} />
            People
          </NavLink>
        )}

        {/* ===== Admin only ===== */}
        {role === 'admin' && (
          <NavLink to="/admin" className={linkClass}>
            <Shield size={18} />
            Admin
          </NavLink>
        )}
      </nav>

      {/* ===== Footer ===== */}
      <div className="p-3 border-t">
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="flex items-center gap-3 px-4 py-2 w-full rounded hover:bg-red-50 text-red-600"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}
