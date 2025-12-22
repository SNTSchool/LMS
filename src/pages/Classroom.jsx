import React from 'react'
import { useParams } from 'react-router-dom'

export default function Classroom() {
  const { id } = useParams()

  return (
    <div style={{ padding: 40 }}>
      <h2>Classroom</h2>
      <p>Class ID: {id}</p>
    </div>
  )
}
