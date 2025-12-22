// src/pages/CreateClass.jsx
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../routes/AuthProvider'
import apiFetch from '../api/apiFetch'

export default function CreateClass() {
  const { user, userData, loading } = useAuth()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const navigate = useNavigate()

  if (loading) return null
  if (!user || !['teacher', 'admin'].includes(userData?.role)) {
    return <Navigate to="/classes" />
  }

  const handleCreate = async () => {
    if (!name) {
      Swal.fire('กรุณาระบุชื่อห้องเรียน')
      return
    }

    try {
      const res = await apiFetch('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ name, description: desc })
      })

      Swal.fire({
        icon: 'success',
        title: 'สร้างเรียบร้อย',
        html: `รหัสห้อง: <b>${res.code}</b>`
      })

      navigate(`/classes/${res.id}`)
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-3">สร้างห้องเรียน</h2>

      <input
        className="w-full mb-2 p-2 border"
        placeholder="ชื่อห้อง"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <textarea
        className="w-full mb-2 p-2 border"
        placeholder="คำอธิบาย"
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />

      <button
        onClick={handleCreate}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        สร้างห้องเรียน
      </button>
    </div>
  )
}