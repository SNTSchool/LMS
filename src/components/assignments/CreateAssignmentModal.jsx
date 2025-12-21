import { useState } from 'react'
import apiFetch from '../../api/apiFetch'

export default function CreateAssignmentModal({ classId, onClose }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  const submit = async () => {
    await apiFetch(`/api/classes/${classId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ title, description: desc })
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white p-4 rounded w-96">
        <h3 className="font-semibold mb-2">Create Assignment</h3>
        <input
          className="border w-full mb-2 p-2"
          placeholder="Title"
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="border w-full mb-2 p-2"
          placeholder="Description"
          onChange={e => setDesc(e.target.value)}
        />
        <button
          onClick={submit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </div>
    </div>
  )
}
