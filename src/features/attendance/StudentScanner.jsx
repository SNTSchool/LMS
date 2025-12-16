// src/features/attendance/StudentScanner.jsx
import React, { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { Html5Qrcode } from "html5-qrcode";
import { markAttendance } from "../../services/attendanceService";
import { useAuth } from "../../routes/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function StudentScanner() {
  const { user } = useAuth();
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const navigate = useNavigate();

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
            // temporarily stop scanning
            try { await html5QrcodeRef.current.pause(); } catch(e){}

            try {
              const parsed = JSON.parse(decodedText);
              const { sessionId, classId } = parsed;

              // prevent repeat alerts: store lastSession in sessionStorage
              const lastSession = sessionStorage.getItem('lastScannedSession');
              if (lastSession === sessionId) {
                // already scanned in this browser session — redirect silently
                navigate(`/classes/${classId}`);
                return;
              }

              const res = await markAttendance({ sessionId, classId, user });

              if (res.already) {
                // already checked in: redirect to class without duplicate sweetalert
                sessionStorage.setItem('lastScannedSession', sessionId);
                navigate(`/classes/${classId}`);
                return;
              }

              // success
              sessionStorage.setItem('lastScannedSession', sessionId);
              await Swal.fire({ icon: 'success', title: 'เช็คชื่อสำเร็จ', timer: 1200, showConfirmButton: false });
              navigate(`/classes/${classId}`);
            } catch (err) {
              await Swal.fire({ icon: 'error', title: 'เช็คชื่อไม่สำเร็จ', text: err.message || String(err) });
            } finally {
              try { await html5QrcodeRef.current.resume(); } catch(e){}
            }
          },
          (errorMessage) => {
            // scan failure — ignore
          }
        );
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถเข้าถึงกล้อง', text: err.message });
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
  }, [user, navigate]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h3 className="text-xl font-bold">สแกน QR เช็คชื่อ</h3>
      <div id="html5qr-reader" ref={scannerRef} className="w-full border rounded bg-white p-2" style={{ minHeight: 360 }} />
      <p className="text-sm text-slate-500">อนุญาตการใช้งานกล้องและสแกน QR ที่อาจารย์แสดง</p>
    </div>
  );
}