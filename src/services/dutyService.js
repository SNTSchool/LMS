// src/services/dutyService.js
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function fileDutyReport({ userId, date, description, hours = 0 }) {
  const ref = await addDoc(collection(db, 'duty_reports'), {
    userId,
    date,
    description,
    hours,
    createdAt: serverTimestamp(),
    approved: false
  });
  return ref.id;
}

export async function listDutyReports({ userId } = {}) {
  const col = collection(db, 'duty_reports');
  let q;
  if (userId) q = query(col, where('userId', '==', userId));
  else q = query(col);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}