import { useEffect, useState } from 'react'
import { apiFetch } from '../api/api'
import { Link } from 'react-router-dom'

export default function Classes() {
  const [classes, setClasses] = useState([])

  useEffect(() => {
    apiFetch('/api/classes')
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data)
        } else {
          setClasses([])
        }
      })
      .catch(() => setClasses([]))
  }, [])

  return (
    <div>
      <Link to="/classes/create">+ Create Class</Link>

      {classes.map(c => (
        <div key={c.id}>
          <Link to={`/classes/${c.id}`}>
            {c.name} ({c.section})
          </Link>
        </div>
      ))}
    </div>
  )
}
