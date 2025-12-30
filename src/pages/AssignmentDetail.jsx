import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiFetch from '../api/apiFetch'
import Sidebar from '../components/Sidebar'
import Swal from 'sweetalert2'

export default function AssignmentDetail() {
  const { classId, assignmentId } = useParams()
  const [assignment, setAssignment] = useState(null)
  const [file, setFile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // load class detail then find assignment
    apiFetch(`/api/classes/${classId}`).then(data => {
      const a = (data.assignments || []).find(x => x.id === assignmentId)
      if (!a) {
        Swal.fire({ icon: 'error', title: 'Not found' })
        navigate('/assignments')
      } else setAssignment(a)
    }).catch(err => {
      Swal.fire({ icon: 'error', text: err.message })
      navigate('/assignments')
    })
  }, [classId, assignmentId])

  const handleSubmit = async () => {
    if (!file) return Swal.fire({ icon: 'error', text: 'Please choose a file' })
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('classId', classId)
      const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await (await fetch('/__/auth/token')).text()}` // placeholder - we use apiFetch normally
        }
      })
      // simpler: use apiFetch with FormData
      // but apiFetch sets JSON header by default — so call fetch directly with token
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', text: 'Submit failed' })
    }
  }

  // better version using apiFetch (with token) — using apiFetch but must allow FormData (it supports when body is FormData)
  const handleSubmit2 = async () => {
    if (!file) return Swal.fire({ icon: 'error', text: 'Please choose a file' })
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('classId', classId)
      await apiFetch(`/api/assignments/${assignmentId}/submit`, { method: 'POST', body: fd })
      Swal.fire({ icon: 'success', title: 'Submitted' })
    } catch (err) {
      Swal.fire({ icon: 'error', text: err.message })
    }
  }

  if (!assignment) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-green-50">
      <Sidebar />
      <main className="md:ml-64 p-6">
        <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
        <div className="mb-4 text-sm text-gray-600">{assignment.description}</div>

        <div className="bg-white p-4 rounded shadow">
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          <div className="mt-3">
            <button onClick={handleSubmit2} className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>
          </div>
        </div>
      </main>
    </div>
  )
}
