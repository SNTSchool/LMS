// src/features/attendance/StudentScanner.jsx
import React, { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { Html5Qrcode } from "html5-qrcode";
import { markAttendance } from "../../services/attendanceService";
import { useAuth } from "../../routes/AuthProvider";

export default function StudentScanner() {
  const { user } = useAuth();
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    const elementId = "html5qr-reader";
    const config = { fps: 10, qrbox: 250 };

    const startScanner = async () => {
      try {
        html5QrcodeRef.current = new Html5Qrcode(elementId);
        await html5QrcodeRef.current.start(
          { facingMode: "environment" },
          config,
          async (decodedText, decodedResult) => {
            // stop scanner while processing
            try {
              await html5QrcodeRef.current.pause();
            } catch(e){}

            try {
              const parsed = JSON.parse(decodedText);
              const { sessionId, courseId } = parsed;
              await markAttendance({ sessionId, courseId, user });
              Swal.fire({ icon: "success", title: "เช็คชื่อสำเร็จ" });
            } catch (err) {
              Swal.fire({ icon: "error", title: "ไม่สามารถเช็คชื่อได้", text: err.message || String(err) });
            } finally {
              try {
                await html5QrcodeRef.current.resume();
              } catch(e){}
            }
          },
          (errorMessage) => {
            // scan failure, ignore or show tiny console
            // console.warn("scan failed", errorMessage);
          }
        );
      } catch (err) {
        Swal.fire({ icon: "error", title: "ไม่สามารถเข้าถึงกล้อง", text: err.message });
      }
    };

    startScanner();

    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(() => {}).finally(() => {
          html5QrcodeRef.current.clear().catch(() => {});
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h3 className="text-xl font-bold">สแกน QR เช็คชื่อ</h3>
      <div id="html5qr-reader" ref={scannerRef} className="w-full border rounded bg-white p-2" style={{ minHeight: 360 }} />
      <p className="text-sm text-slate-500">กรุณาอนุญาตการเข้าถึงกล้อง และสแกน QR ที่อาจารย์แสดง</p>
    </div>
  );
}
