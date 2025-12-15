import React, { useEffect, useState } from 'react';
import { listClubs, createClub } from '../../services/clubService';
import Swal from 'sweetalert2';

export default function ClubList(){
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    let mounted = true;
    listClubs().then(list => { if(mounted){ setClubs(list); setLoading(false); }});
    return ()=> mounted = false;
  }, []);

  const handleCreate = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'สร้างชมรมใหม่',
      html:
        '<input id="swal-name" class="swal2-input" placeholder="ชื่อชมรม">' +
        '<textarea id="swal-desc" class="swal2-textarea" placeholder="คำอธิบาย"></textarea>',
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const desc = document.getElementById('swal-desc').value;
        if(!name) Swal.showValidationMessage('กรุณาระบุชื่อชมรม');
        return { name, desc };
      }
    });

    if (formValues) {
      try {
        const id = await createClub(formValues);
        Swal.fire({ icon: 'success', title: 'สร้างชมรมเรียบร้อย', timer: 1200, showConfirmButton: false });
        const updated = await listClubs();
        setClubs(updated);
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'ไม่สำเร็จ', text: err.message });
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">ชมรม</h3>
        <button onClick={handleCreate} className="py-2 px-4 bg-primary-600 text-white rounded">+ สร้างชมรม</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map(c => (
            <div key={c.id} className="p-4 bg-white rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{c.name}</h4>
                  <p className="text-sm text-slate-500">{c.description}</p>
                </div>
                <div className="text-sm text-slate-400">{c.membersCount || 0} สมาชิก</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
