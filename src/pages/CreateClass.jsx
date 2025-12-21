import { auth } from '../firebaseConfig'

const API_URL = import.meta.env.VITE_API_URL

export default async function apiFetch(path, options = {}) {
  const user = auth.currentUser

  if (!user) {
    throw new Error('ยังไม่ได้เข้าสู่ระบบ')
  }

  const token = await user.getIdToken()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }

  return res.json()
}
