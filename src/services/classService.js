// src/services/classService.js
import {
  collection, doc, setDoc, addDoc, getDoc, getDocs, serverTimestamp, query
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function createClass({ id, name, description, instructorId }) {
  if (id) {
    const ref = doc(db, "classes", id);
    await setDoc(ref, { id, name, description, instructorId, createdAt: serverTimestamp() });
    return ref.id;
  } else {
    const ref = await addDoc(collection(db, "classes"), { name, description, instructorId, createdAt: serverTimestamp() });
    return ref.id;
  }
}

export async function listClasses() {
  const snap = await getDocs(query(collection(db, "classes")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getClass(classId) {
  const ref = doc(db, "classes", classId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createAssignment(classId, { title, description, dueAt, createdBy }) {
  const assignmentsCol = collection(db, `classes/${classId}/assignments`);
  const ref = await addDoc(assignmentsCol, {
    title,
    description,
    dueAt: dueAt || null,
    createdAt: serverTimestamp(),
    createdBy: createdBy || null
  });
  return ref.id;
}

export async function listAssignments(classId) {
  const snap = await getDocs(collection(db, `classes/${classId}/assignments`));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}