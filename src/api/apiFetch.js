// src/api/apiFetch.js
import { auth } from '../firebaseConfig'

const API_BASE = import.meta.env.VITE_API_URL // e.g. https://your-backend.onrender.com

export default async function apiFetch(path, options = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const token = await user.getIdToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  })

  // always return JSON or throw
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
    return json
  } catch (e) {
    // text is not json => treat as error message
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`)
    // if ok but not json, return raw text
    return text
  }
}
