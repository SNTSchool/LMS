// src/pages/CreateClass.jsx
import React, { useState } from 'react'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../routes/AuthProvider'

export default function CreateClass() {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const { userData } = useAuth()
  const navigate = useNavigate()

  const handleCreate = async () => {
    if (!name) {
      Swal.fire('กรุณาระบุชื่อห้องเรียน')
      return
    }
    try {
      const res = await apiFetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc })
      })
      Swal.fire({ icon: 'success', title: 'สร้างเรียบร้อย', html: `รหัสห้อง: <b>${res.code}</b>` })
      navigate(`/classes/${res.id}`)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message })
    }
  }

  if (userData?.role !== 'instructor' && userData?.role !== 'admin') {
    return <div>คุณไม่มีสิทธิ์สร้างห้องเรียน</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded">
      <h2 className="text-xl font-bold mb-3">สร้างห้องเรียน</h2>
      <input className="w-full mb-2 p-2 border" placeholder="ชื่อห้อง" value={name} onChange={e=>setName(e.target.value)} />
      <textarea className="w-full mb-2 p-2 border" placeholder="คำอธิบาย (optional)" value={desc} onChange={e=>setDesc(e.target.value)} />
      <div className="flex gap-2">
        <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded">สร้าง</button>
      </div>
    </div>
  )
}
