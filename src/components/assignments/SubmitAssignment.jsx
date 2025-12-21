import { useState } from 'react'
import apiFetch from '../../api/apiFetch'

export default function SubmitAssignment({ assignmentId }) {
  const [file, setFile] = useState(null)

  const submit = async e => {
    e.preventDefault()
    if (!file) return

    const fd = new FormData()
    fd.append('file', file)

    await apiFetch(`/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: fd
    })

    alert('Submitted')
  }

  return (
    <form onSubmit={submit} className="border p-4 rounded">
      <input
        type="file"
        onChange={e => setFile(e.target.files[0])}
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded ml-2"
      >
        Submit
      </button>
    </form>
  )
}
