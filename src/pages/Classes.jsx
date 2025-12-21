import { useEffect, useState } from 'react'
import { apiFetch } from '../api/api'
import { useAuth } from '../routes/AuthProvider'

export default function Classes() {
  const { user, loading } = useAuth()
  const [classes, setClasses] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
  if (loading || !user) return   

  const loadClasses = async () => {
    try {
      const token = await user.getIdToken()

      const res = await fetch(`${API_URL}/api/classes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (!Array.isArray(data)) {
        console.error('Classes API returned:', data)
        setClasses([])
        return
      }

      setClasses(data)

    } catch (err) {
      console.error(err)
      setClasses([])
    }
  }

  loadClasses()
}, [user, loading])


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
