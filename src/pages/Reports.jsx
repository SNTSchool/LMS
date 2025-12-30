import React, { useState } from 'react'
import apiFetch from '../api/apiFetch'
import Sidebar from '../components/Sidebar'
import Swal from 'sweetalert2'

export default function Reports() {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)

  const handleUpload = async () => {
    if (!title || !file) return Swal.fire({ icon: 'error', text: 'Title and file required' })
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title)
      await apiFetch('/api/reports', { method: 'POST', body: fd })
      Swal.fire({ icon: 'success', title: 'Uploaded' })
      setTitle(''); setFile(null)
    } catch (err) {
      Swal.fire({ icon: 'error', text: err.message })
    }
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Sidebar />
      <main className="md:ml-64 p-6">
        <h1 className="text-2xl font-bold mb-4">Duty Reports</h1>
        <div className="bg-white p-4 rounded shadow max-w-lg">
          <input className="w-full border p-2 mb-2" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          <div className="mt-3">
            <button onClick={handleUpload} className="px-4 py-2 bg-green-600 text-white rounded">Upload to Drive</button>
          </div>
        </div>
      </main>
    </div>
  )
}
