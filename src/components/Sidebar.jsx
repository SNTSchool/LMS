// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { auth } from '../firebaseConfig'
import { useAuth } from '../routes/AuthProvider'

const API = import.meta.env.VITE_API_BASE

export default function Sidebar() {
  const { userData } = useAuth()
  const [classes, setClasses] = useState([])
  const location = useLocation()

  useEffect(() => {
    const load = async () => {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch(`${API}/api/classes`, {
        headers: { Authorization: 'Bearer ' + token }
      })
      const data = await res.json()
      setClasses(data)
    }
    load()
  }, [])

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-100 flex flex-col fixed">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700">
        <div className="text-lg font-bold">UNI Classroom</div>
        <div className="text-xs text-slate-400">
          {userData?.email}
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <Link
          to="/classes"
          className={`block px-3 py-2 rounded ${
            isActive('/classes')
              ? 'bg-primary-600 text-white'
              : 'hover:bg-slate-800'
          }`}
        >
          📚 ห้องเรียนทั้งหมด
        </Link>

        {(userData?.role === 'instructor' || userData?.role === 'admin') && (
          <Link
            to="/classes/create"
            className={`block px-3 py-2 rounded ${
              isActive('/classes/create')
                ? 'bg-primary-600 text-white'
                : 'hover:bg-slate-800'
            }`}
          >
            ➕ สร้างห้องเรียน
          </Link>
        )}

        <div className="mt-4 px-3 text-xs uppercase tracking-wide text-slate-400">
          ห้องเรียนของคุณ
        </div>

        {classes.length === 0 && (
          <div className="px-3 py-2 text-sm text-slate-500">
            ไม่มีห้องเรียน
          </div>
        )}

        {classes.map(c => (
          <Link
            key={c.id}
            to={`/classes/${c.id}`}
            className={`block px-3 py-2 rounded text-sm ${
              isActive(`/classes/${c.id}`)
                ? 'bg-slate-700'
                : 'hover:bg-slate-800'
            }`}
          >
            <div className="font-medium truncate">{c.name}</div>
            <div className="text-xs text-slate-400 truncate">
              ID: {c.id}
            </div>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
        Role: {userData?.role}
      </div>
    </aside>
  )
}
