// src/services/attendanceService.js
import {
  addDoc, collection, doc, getDoc, serverTimestamp, query, where, getDocs, Timestamp, updateDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Create attendance session for a class
 * - classId required
 * - instructorId required
 * - durationMinutes optional
 */
export async function createAttendanceSession({ classId, instructorId, durationMinutes = 10 }) {
  if (!classId || !instructorId) throw new Error("classId and instructorId required");

  // expiresAt as Timestamp (serverTimestamp cannot be offset easily)
  const expiresAtDate = new Date(Date.now() + durationMinutes * 60 * 1000);
  const expiresAt = Timestamp.fromDate(expiresAtDate);

  const ref = await addDoc(collection(db, "attendance_sessions"), {
    classId,
    instructorId,
    createdAt: serverTimestamp(),
    startedAt: serverTimestamp(),
    expiresAt,
    active: true,
    durationMinutes
  });

  const payload = { sessionId: ref.id, classId };
  return { sessionId: ref.id, qrPayload: JSON.stringify(payload) };
}

export async function markAttendance({ sessionId, classId, user }) {
  if (!sessionId || !user || !user.uid) throw new Error("Missing parameters");

  const sessionRef = doc(db, "attendance_sessions", sessionId);
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) throw new Error("Session not found");

  const session = sessionSnap.data();
  if (!session.active) throw new Error("Session is closed");

  // expiresAt may be Firestore Timestamp
  if (session.expiresAt) {
    const expires = session.expiresAt.toDate ? session.expiresAt.toDate() : new Date(session.expiresAt);
    if (new Date() > expires) throw new Error("Session has expired");
  }

  // duplicate check
  const recordsRef = collection(db, "attendance_records");
  const q = query(recordsRef, where("sessionId", "==", sessionId), where("userId", "==", user.uid));
  const snap = await getDocs(q);
  if (!snap.empty) return { already: true };

  const rec = await addDoc(recordsRef, {
    sessionId,
    classId,
    userId: user.uid,
    email: user.email || null,
    scannedAt: serverTimestamp(),
    status: "present"
  });

  return { recordId: rec.id, already: false };
}

export async function closeSession(sessionId) {
  const sessionRef = doc(db, "attendance_sessions", sessionId);
  await updateDoc(sessionRef, { active: false });
}