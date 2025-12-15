import { collection, addDoc, doc, setDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const clubsCol = collection(db, 'clubs');

export async function createClub({ name, description }) {
  const ref = await addDoc(clubsCol, { name, description, membersCount: 1, createdAt: serverTimestamp() });
  // placeholder: owner handling should set member record
  await setDoc(doc(db, `clubs/${ref.id}/members/${ref.id}`), { role: 'admin', joinedAt: serverTimestamp() });
  return ref.id;
}

export async function listClubs() {
  const snap = await getDocs(query(clubsCol));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
