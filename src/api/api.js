import { auth } from '../firebaseConfig'

const API = import.meta.env.VITE_API_URL

export async function apiFetch(path, options = {}) {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Not authenticated')
  }

  const token = await user.getIdToken(true)

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }

  return res.json()
}
