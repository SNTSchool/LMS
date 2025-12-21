// src/components/MobileSidebar.jsx
import React from 'react'
import Sidebar from './Sidebar'

export default function MobileSidebar({ open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative z-50">
        <Sidebar />
      </div>
    </div>
  )
}
