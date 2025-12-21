// src/pages/Classes.jsx
import React, { useEffect, useState } from 'react'
import { auth } from '../firebaseConfig'
import { useAuth } from '../routes/AuthProvider'
import { Link } from 'react-router-dom'
const API = import.meta.env.VITE_API_BASE

export default function ClassesPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      const token = await auth.currentUser.getIdToken()
      const res = await fetch(`${API}/api/classes`, { headers: { Authorization: 'Bearer ' + token } })
      const data = await res.json()
      setClasses(data)
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ห้องเรียน</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classes.map(c => (
          <div key={c.id} className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-sm text-slate-500">{c.description}</p>
            <div className="mt-3 flex justify-between items-center">
              <div className="text-xs text-slate-400 font-mono">ID: {c.id}</div>
              <Link to={`/classes/${c.id}`} className="text-sm text-primary-600">ไปที่ห้อง</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
