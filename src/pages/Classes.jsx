// src/pages/Classes.jsx
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../routes/AuthProvider'
import apiFetch from '../api/apiFetch'

export default function Classes() {
  const { user, loading } = useAuth()
  const [classes, setClasses] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return

    apiFetch('/api/classes')
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data)
        } else {
          setClasses([])
        }
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
  }, [user])

  if (loading) return null
  if (!user) return <Navigate to="/login" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ห้องเรียน</h1>

      {error && <div className="text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classes.map(c => (
          <Link
            key={c.id}
            to={`/classes/${c.id}`}
            className="border p-4 rounded hover:bg-gray-50"
          >
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-sm text-gray-600">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}