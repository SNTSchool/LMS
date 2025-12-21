import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaPlus, FaChalkboardTeacher } from 'react-icons/fa'
import CreateClassModal from './CreateClassModal'
import { useAuth } from '../routes/AuthProvider'

export default function Sidebar() {
  const { userData } = useAuth()
  const [openCreate, setOpenCreate] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col">
        <div className="p-4 font-bold text-lg border-b border-slate-700">
          LMS
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/classes"
            className="flex items-center gap-2 p-2 rounded hover:bg-slate-800"
          >
            <FaChalkboardTeacher />
            ห้องเรียนของฉัน
          </Link>

          {(userData?.role === 'instructor' || userData?.role === 'admin') && (
            <button
              onClick={() => setOpenCreate(true)}
              className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-800 text-left"
            >
              <FaPlus />
              สร้างชั้นเรียน
            </button>
          )}
        </nav>
      </aside>

      {/* Modal */}
      {openCreate && (
        <CreateClassModal
          onClose={() => setOpenCreate(false)}
          onCreated={(classId) => {
            setOpenCreate(false)
            navigate(`/classes/${classId}`)
          }}
        />
      )}
    </>
  )
}
