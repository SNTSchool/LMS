import { useState } from 'react'
import Swal from 'sweetalert2'
import apiFetch from '../api/apiFetch'

export default function JoinClassModal({ onClose, onJoined }) {
  const [code, setCode] = useState('')

  const join = async () => {
    try {
      const res = await apiFetch('/api/classes/join', {
        method: 'POST',
        body: JSON.stringify({ code })
      })

      Swal.fire('เข้าร่วมห้องเรียนแล้ว', '', 'success')

      onJoined({
        id: res.classId,
        name: 'Classroom',
        code
      })
      onClose()
    } catch (err) {
      Swal.fire(
        'ไม่พบห้องเรียน',
        'กรุณาตรวจสอบรหัสอีกครั้ง',
        'error'
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-80">
        <h3 className="font-bold mb-3">เข้าร่วมห้องเรียน</h3>

        <input
          className="w-full border p-2 mb-3"
          placeholder="รหัสห้องเรียน"
          value={code}
          onChange={e => setCode(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>ยกเลิก</button>
          <button
            onClick={join}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            เข้าร่วม
          </button>
        </div>
      </div>
    </div>
  )
}
