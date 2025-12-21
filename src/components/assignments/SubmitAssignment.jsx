import { useState } from 'react'
import apiFetch from '../../api/apiFetch'

export default function SubmitAssignment({ classId, assignmentId }) {
  const [file, setFile] = useState(null)

  const submit = async () => {
    const form = new FormData()
    form.append('file', file)

    await apiFetch(
      `/api/classes/${classId}/assignments/${assignmentId}/upload`,
      {
        method: 'POST',
        body: form,
        headers: {} // ⚠️ ห้ามใส่ Content-Type
      }
    )

    alert('ส่งงานแล้ว')
  }

  return (
    <div className="mt-2">
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button
        onClick={submit}
        className="ml-2 px-3 py-1 bg-green-600 text-white rounded"
      >
        ส่งงาน
      </button>
    </div>
  )
}
