import React, { useEffect, useState } from 'react'
import apiFetch from '../api/apiFetch'
import FloatingAction from '../components/FloatingAction'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Classes() {
  const [classes, setClasses] = useState([])
  const navigate = useNavigate()

  const load = async () => {
    try {
      const data = await apiFetch('/api/classes')
      if (!Array.isArray(data)) setClasses([])
      else setClasses(data)
    } catch (err) {
      setClasses([])
      console.error(err)
    }
  }

  useEffect(() => { load() }, [])

  const openDialog = async () => {
    const res = await Swal.fire({
      title: 'Create or Join',
      showDenyButton: true,
      confirmButtonText: 'Create Class',
      denyButtonText: 'Join with code'
    })

    if (res.isConfirmed) {
      const { value: name } = await Swal.fire({ title: 'Class name', input: 'text' })
      if (name) {
        try {
          const r = await apiFetch('/api/classes', { method: 'POST', body: JSON.stringify({ name }) })
          Swal.fire({ icon: 'success', title: 'Created', text: `Code: ${r.code || r.id}` })
          navigate(`/classes/${r.id}`)
        } catch (err) { Swal.fire({ icon: 'error', text: err.message }) }
      }
    } else if (res.isDenied) {
      const { value: code } = await Swal.fire({ title: 'Enter class code', input: 'text' })
      if (code) {
        try {
          const r = await apiFetch('/api/classes/join', { method: 'POST', body: JSON.stringify({ code }) })
          navigate(`/classes/${r.classId}`)
        } catch (err) { Swal.fire({ icon: 'error', text: err.message }) }
      }
    }
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Sidebar />
      <main className="md:ml-64 p-6">
        <h1 className="text-2xl font-bold mb-4">Classes</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.id} className="bg-white p-4 rounded shadow cursor-pointer" onClick={() => navigate(`/classes/${c.id}`)}>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-gray-500">{c.code}</div>
            </div>
          ))}
          {classes.length === 0 && <div className="text-gray-500">No classes yet</div>}
        </div>
        <FloatingAction onClick={openDialog} />
      </main>
    </div>
  )
}
