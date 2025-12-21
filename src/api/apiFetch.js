import { getAuth } from 'firebase/auth'

const API_URL = import.meta.env.VITE_API_URL

export default async function apiFetch(path, options = {}) {
  const auth = getAuth()
  const user = auth.currentUser

  const headers = options.headers || {}

  if (user) {
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(API_URL + path, {
    ...options,
    headers
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }

  return res.json()
}
