import React, { useEffect, useState } from 'react'
import { auth } from '../firebaseConfig'

const API = 'https://lms-4ljz.onrender.com/'

export default function Classes() {
  const [classes, setClasses] = useState([])

  useEffect(() => {
    auth.currentUser.getIdToken().then(token => {
      fetch(API + '/api/classes', {
        headers: { Authorization: 'Bearer ' + token }
      })
        .then(r => r.json())
        .then(setClasses)
    })
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ห้องเรียน</h1>
      <ul className="grid grid-cols-3 gap-4">
        {classes.map(c => (
          <li key={c.id} className="p-4 border rounded">
            <div className="font-semibold">{c.name}</div>
            <div className="text-sm text-slate-500">{c.description}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
