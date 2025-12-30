import React from 'react'
export default function FloatingAction({ onClick }) {
  return (
    <button onClick={onClick} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 text-white text-3xl shadow-lg">+</button>
  )
}
