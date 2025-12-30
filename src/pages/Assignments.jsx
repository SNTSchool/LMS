import React, { useEffect, useState } from 'react'
import apiFetch from '../api/apiFetch'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Assignments() {
  const [assignments, setAssignments] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/api/assignments')
        setAssignments(data)
      } catch (err) {
        console.error(err)
        setAssignments([])
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-green-50">
      <Sidebar />
      <main className="md:ml-64 p-6">
        <h1 className="text-2xl font-bold mb-4">Assignments</h1>
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={`${a.classId}-${a.id}`} className="p-3 bg-white rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{a.title}</div>
                <div className="text-xs text-gray-500">{a.className} • {a.type}</div>
              </div>
              <button onClick={() => navigate(`/assignments/${a.classId}/${a.id}`)} className="px-3 py-1 bg-green-600 text-white rounded">Open</button>
            </div>
          ))}
          {assignments.length === 0 && <div className="text-gray-500">No assignments</div>}
        </div>
      </main>
    </div>
  )
}
