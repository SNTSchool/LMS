// src/pages/JoinClass.jsx
import React, { useState, useEffect } from 'react'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'
import { useNavigate, useLocation } from 'react-router-dom'

function useQuery() { return new URLSearchParams(useLocation().search) }

export default function JoinClass() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const q = useQuery()
  const pre = q.get('code')
  useEffect(()=> { if (pre) setCode(pre) }, [pre])

  const handleJoin = async () => {
    if (!code) return Swal.fire('กรุณากรอกรหัสห้อง')
    try {
      const res = await apiFetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      Swal.fire({ icon: 'success', title: 'เข้าร่วมห้องเรียบร้อย' })
      navigate(`/classes/${res.classId}`)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ไม่สำเร็จ', text: err.message })
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded">
      <h2 className="text-lg font-bold mb-2">เข้าร่วมห้องเรียนด้วยรหัส</h2>
      <input value={code} onChange={e=>setCode(e.target.value)} className="w-full mb-2 p-2 border" placeholder="กรอกรหัส (case-sensitive)" />
      <div className="flex gap-2">
        <button onClick={handleJoin} className="px-4 py-2 bg-blue-600 text-white rounded">เข้าร่วม</button>
      </div>
    </div>
  )
}
