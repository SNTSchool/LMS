import { useEffect, useState } from 'react'
import { apiFetch } from '../api/api'
import { useAuth } from '../routes/AuthProvider'

export default function Classes() {
  const { user, loading } = useAuth()
  const [classes, setClasses] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (loading || !user) return

    apiFetch('/api/classes')
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data)
        } else {
          setClasses([])
        }
      })
      .catch(err => {
        setError(err.message)
        setClasses([])
      })
  }, [loading, user])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {classes.map(c => (
        <div key={c.id}>{c.name}</div>
      ))}
    </div>
  )
}
