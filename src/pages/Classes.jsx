import React from 'react'
import { useAuth } from '../routes/AuthProvider'
import { Link } from 'react-router-dom'

export default function Classes() {
  const { user } = useAuth()

  return (
    <div style={{ padding: 40 }}>
      <h2>My Classes</h2>
      <p>Welcome: {user.email}</p>

      <ul>
        <li>
          <Link to="/classes/demo">Demo Classroom</Link>
        </li>
      </ul>
    </div>
  )
}
