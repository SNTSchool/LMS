// src/components/Layout.jsx
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-100 p-4">
        {children}
      </main>
    </div>
  )
}
