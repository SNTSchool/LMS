// src/features/classroom/ClassList.jsx
import React, { useEffect, useState } from 'react'
import { listClasses } from '../../services/classService'
import { Link } from 'react-router-dom'
import { useAuth } from '../../routes/AuthProvider'

export default function ClassList() {
  const [classes, setClasses] = useState([])
  const { userData } = useAuth()

  useEffect(() => {
    listClasses().then(setClasses).catch(console.error)
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ชั้นเรียนของฉัน</h2>
        {userData?.role === 'instructor' && (
          <Link to="/classes/new" className="px-4 py-2 bg-primary-600 text-white rounded">สร้างชั้นเรียน</Link>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map(c => (
          <div key={c.id} className="p-4 bg-white rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-sm text-slate-500">{c.description}</p>
              </div>
              <div className="text-sm text-slate-400">{c.id}</div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link to={`/classes/${c.id}`} className="px-3 py-2 border rounded text-sm">เข้าไป</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}