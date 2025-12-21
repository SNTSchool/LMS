import React, { useState } from 'react'
import apiFetch from '../api/apiFetch'
import Swal from 'sweetalert2'

export default function CreateClassModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      Swal.fire('กรุณากรอกชื่อห้องเรียน')
      return
    }

    try {
      setLoading(true)
      const res = await apiFetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: desc
        })
      })

      Swal.fire({
        icon: 'success',
        title: 'สร้างห้องเรียนสำเร็จ',
        html: `รหัสห้องเรียน: <b>${res.code}</b>`
      })

      onCreated(res.id)
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'สร้างไม่สำเร็จ',
        text: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-5 space-y-4">
        <h2 className="text-lg font-bold">สร้างชั้นเรียน</h2>

        <input
          className="w-full border p-2 rounded"
          placeholder="ชื่อห้องเรียน"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder="คำอธิบาย (ไม่บังคับ)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-green-600 text-white"
            disabled={loading}
          >
            {loading ? 'กำลังสร้าง...' : 'สร้าง'}
          </button>
        </div>
      </div>
    </div>
  )
}
