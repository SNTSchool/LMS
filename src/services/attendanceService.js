// src/services/attendanceService.js
import { addDoc, collection, doc, getDoc, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * createAttendanceSession for a specific class
 * - classId
 * - instructorId
 * - durationMinutes
 */
export async function createAttendanceSession({ classId, instructorId, durationMinutes = 10 }) {
  if (!classId || !instructorId) throw new Error('classId and instructorId required');

  const docRef = await addDoc(collection(db, "attendance_sessions"), {
    classId,
    instructorId,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
    active: true,
    durationMinutes
  });

  const payload = { sessionId: docRef.id, classId };

  return { sessionId: docRef.id, qrPayload: JSON.stringify(payload) };
}

/**
 * markAttendance: record scan for session
 * - prevent duplicate per session per user
 */
export async function markAttendance({ sessionId, classId, user }) {
  if (!sessionId || !user || !user.uid) throw new Error("missing parameters");

  const sessionRef = doc(db, "attendance_sessions", sessionId);
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) throw new Error("Session not found");

  const session = sessionSnap.data();
  if (!session.active) throw new Error("Session is closed");
  if (session.expiresAt) {
    const expires = session.expiresAt.toDate ? session.expiresAt.toDate() : new Date(session.expiresAt);
    if (new Date() > expires) throw new Error("Session has expired");
  }

  // check duplicate
  const recordsRef = collection(db, "attendance_records");
  const q = query(recordsRef, where("sessionId", "==", sessionId), where("userId", "==", user.uid));
  const snap = await getDocs(q);
  if (!snap.empty) {
    // Already checked in
    return { already: true };
  }

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

/**
 * closeSession (optional)
 */
export async function closeSession(sessionId) {
  const sessionRef = doc(db, "attendance_sessions", sessionId);
  await updateDoc(sessionRef, { active: false });
}