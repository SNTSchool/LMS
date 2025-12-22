import { useEffect, useState } from 'react'
import apiFetch from '../api/apiFetch'

export default function Classes() {
  const [classes, setClasses] = useState([])

  useEffect(() => {
    apiFetch('/api/classes').then(data => {
      setClasses(Array.isArray(data) ? data : [])
    })
  }, [])

  return (
    <div>
      {classes.map(c => (
        <div key={c.id}>
          <b>{c.name}</b> ({c.code})
        </div>
      ))}
    </div>
  )
}