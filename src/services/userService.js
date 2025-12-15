// src/services/userService.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function getUserProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
