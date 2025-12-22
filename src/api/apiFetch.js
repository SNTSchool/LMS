import { auth } from '../firebase'

export default async function apiFetch(url, options = {}) {
  const user = auth.currentUser

  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json'
  }

  if (user) {
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(
    import.meta.env.VITE_API_BASE_URL + url,
    {
      ...options,
      headers
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }

  return res.json()
}
