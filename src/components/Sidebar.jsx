// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-full">
      <div className="p-4 font-bold text-lg">
        Learning Management System
      </div>

      <nav className="flex flex-col gap-1 px-2">
        <NavLink to="/classes" className="p-2 rounded hover:bg-gray-100">
          ห้องเรียน
        </NavLink>

        <NavLink to="/assignments" className="p-2 rounded hover:bg-gray-100">
          งานทั้งหมด
        </NavLink>

        <NavLink to="/drive" className="p-2 rounded hover:bg-gray-100">
          ไฟล์ของฉัน
        </NavLink>

        <div className="border-t my-2" />

        <button
          onClick={() => alert('logout later')}
          className="p-2 text-left rounded hover:bg-red-100 text-red-600"
        >
          ออกจากระบบ
        </button>
      </nav>
    </aside>
  )
}
