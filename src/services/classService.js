// src/services/classService.js
import { collection, doc, addDoc, getDoc, setDoc, getDocs, query, where, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseConfig'

const classesCol = collection(db, 'classes')

export async function createClass({ id, name, description, instructorId }) {
  // id optional: if provided use setDoc with id, else addDoc
  if (id) {
    const ref = doc(db, 'classes', id)
    await setDoc(ref, { id, name, description, instructorId, createdAt: serverTimestamp() })
    return ref.id
  } else {
    const ref = await addDoc(classesCol, { name, description, instructorId, createdAt: serverTimestamp() })
    return ref.id
  }
}

export async function listClasses() {
  const snap = await getDocs(query(classesCol))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getClass(classId) {
  const ref = doc(db, 'classes', classId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function createAssignment(classId, { title, description, dueAt }) {
  const assignmentsCol = collection(db, `classes/${classId}/assignments`)
  const ref = await addDoc(assignmentsCol, { title, description, dueAt: dueAt || null, createdAt: serverTimestamp() })
  return ref.id
}

export async function listAssignments(classId) {
  const snap = await getDocs(collection(db, `classes/${classId}/assignments`))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}