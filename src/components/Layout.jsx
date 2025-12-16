import React from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-primary-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}