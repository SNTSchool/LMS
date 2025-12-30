import { auth } from '../firebase'

const BASE = import.meta.env.VITE_API_URL || ''

export default async function apiFetch(path, options = {}) {
  const user = auth.currentUser
  const headers = { ...(options.headers || {}) }

  // If body is FormData, don't set content-type (browser will set boundary)
  const isForm = options.body instanceof FormData

  if (!isForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  if (user) {
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(BASE + path, { ...options, headers })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || res.statusText)
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}
