import { useState } from 'react'
import apiFetch from '../../api/apiFetch'

export default function CreateAssignment({ classId, onDone }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('file')

  const submit = async () => {
    await apiFetch(`/api/classes/${classId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ title, type })
    })
    setTitle('')
    onDone?.()
  }

  return (
    <div className="border p-3 rounded">
      <input
        className="border p-2 w-full mb-2"
        placeholder="ชื่องาน"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <select
        className="border p-2 w-full mb-2"
        value={type}
        onChange={e => setType(e.target.value)}
      >
        <option value="file">ไฟล์</option>
        <option value="text">ข้อความ</option>
        <option value="link">ลิงก์</option>
      </select>

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        มอบหมาย
      </button>
    </div>
  )
}
