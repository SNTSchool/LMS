// src/layouts/AppLayout.jsx
import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileSidebar from '../components/MobileSidebar'

export default function AppLayout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex">
      {/* Desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile */}
      <MobileSidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex-1 md:ml-64 min-h-screen bg-slate-100">
        {/* Topbar (mobile) */}
        <div className="md:hidden flex items-center p-3 bg-white shadow">
          <button onClick={() => setOpen(true)} className="text-xl">
            ☰
          </button>
          <div className="ml-3 font-bold">UNI Classroom</div>
        </div>

        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
