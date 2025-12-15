import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-primary-50 flex">
      <Sidebar />
      <main className="flex-1 p-6 md:ml-64">
        {children}
      </main>
    </div>
  )
}
