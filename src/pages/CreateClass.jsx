import { useState } from 'react'
import apiFetch from '../api/apiFetch'
import { useNavigate } from 'react-router-dom'

export default function CreateClass() {
  const [name, setName] = useState('')
  const nav = useNavigate()

  const create = async () => {
    const res = await apiFetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    nav(`/classes/${res.id}`)
  }

  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={create}>Create</button>
    </div>
  )
}