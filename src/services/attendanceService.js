// src/services/attendanceService.js
import { addDoc, collection, doc, getDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * createAttendanceSession
 * - courseId: string
 * - instructorId: uid
 * - durationMinutes: number (optional, default 10)
 *
 * Returns: { sessionId, qrPayload } where qrPayload is JSON string to encode in QR
 */
export async function createAttendanceSession({ courseId, instructorId, durationMinutes = 10 }) {
  if (!courseId || !instructorId) {
    throw new Error("courseId and instructorId are required");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  const docRef = await addDoc(collection(db, "attendance_sessions"), {
    courseId,
    instructorId,
    createdAt: serverTimestamp(),
    startedAt: serverTimestamp(),
    expiresAt: expiresAt,  // client/server will interpret; can be overwritten by server via function later
    active: true,
    durationMinutes
  });

  // QR payload — keep it minimal
  const payload = { sessionId: docRef.id, courseId };

  return { sessionId: docRef.id, qrPayload: JSON.stringify(payload) };
}

/**
 * markAttendance
 * - sessionId: string
 * - courseId: string
 * - user: firebase.User (or at least { uid, email })
 *
 * Behaviour:
 * - validate session exists and active and not expired
 * - check if user already recorded for this session
 * - add record in attendance_records
 */
export async function markAttendance({ sessionId, courseId, user }) {
  if (!sessionId || !user || !user.uid) throw new Error("missing parameters");

  // read session
  const sessionRef = doc(db, "attendance_sessions", sessionId);
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) throw new Error("Session not found");

  const session = sessionSnap.data();

  if (!session.active) throw new Error("Session is closed");
  // session.expiresAt might be stored as timestamp or Date — compare
  if (session.expiresAt) {
    const expires = session.expiresAt.toDate ? session.expiresAt.toDate() : new Date(session.expiresAt);
    if (new Date() > expires) {
      // optionally set active false here (client can't change server truth), but reject
      throw new Error("Session has expired");
    }
  }

  // check duplicate
  const recordsRef = collection(db, "attendance_records");
  const q = query(recordsRef,
    where("sessionId", "==", sessionId),
    where("userId", "==", user.uid)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error("คุณได้เช็คชื่อแล้วสำหรับ session นี้");
  }

  // write record
  const rec = await addDoc(recordsRef, {
    sessionId,
    courseId,
    userId: user.uid,
    email: user.email || null,
    scannedAt: serverTimestamp(),
    status: "present"
  });

  return { recordId: rec.id };
}
