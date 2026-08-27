'use client';
import React, { useState } from 'react';

interface EditRelationsModalProps {
  person: any;
  allPersons: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRelationsModal({ person, allPersons, onClose, onSuccess }: EditRelationsModalProps) {
  const [fid, setFid] = useState<string>(person.fid ? String(person.fid) : '');
  const [mid, setMid] = useState<string>(person.mid ? String(person.mid) : '');
  
  // Xác định danh sách con hiện tại
  const currentChildrenIds = allPersons
    .filter(p => Number(p.fid) === Number(person.id) || Number(p.mid) === Number(person.id))
    .map(p => Number(p.id));

  const [selectedChildrenIds, setSelectedChildrenIds] = useState<number[]>(currentChildrenIds);
  const [loading, setLoading] = useState(false);

  const malePersons = allPersons.filter(p => p.gender === 'male' && Number(p.id) !== Number(person.id));
  const femalePersons = allPersons.filter(p => p.gender === 'female' && Number(p.id) !== Number(person.id));
  const potentialChildren = allPersons.filter(p => Number(p.id) !== Number(person.id));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/persons/update-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: Number(person.id),
          fid: fid ? Number(fid) : null,
          mid: mid ? Number(mid) : null,
          selectedChildrenIds
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert('Lỗi cập nhật: ' + data.error);
      }
    } catch (err) {
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #334155', width: '420px', color: '#fff' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Chỉnh sửa quan hệ: {person.name}</h3>

        {/* Chọn Cha */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Cha đẻ:</label>
          <select
            value={fid}
            onChange={(e) => setFid(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #475569' }}
          >
            <option value="">-- Chưa có / Chưa rõ --</option>
            {malePersons.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.birth_order ? `(${p.birth_order})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Chọn Mẹ */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Mẹ đẻ:</label>
          <select
            value={mid}
            onChange={(e) => setMid(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #475569' }}
          >
            <option value="">-- Chưa có / Chưa rõ --</option>
            {femalePersons.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.birth_order ? `(${p.birth_order})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Chọn Con cái */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Danh sách Con cái:</label>
          <div style={{ maxHeight: '120px', overflowY: 'auto', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px', padding: '8px' }}>
            {potentialChildren.map(p => {
              const pId = Number(p.id);
              const isChecked = selectedChildrenIds.includes(pId);
              return (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChildrenIds([...selectedChildrenIds, pId]);
                      } else {
                        setSelectedChildrenIds(selectedChildrenIds.filter(id => id !== pId));
                      }
                    }}
                  />
                  {p.name} {p.birth_order ? `(${p.birth_order})` : ''}
                </label>
              );
            })}
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#475569', color: '#fff', cursor: 'pointer' }}>
            Hủy
          </button>
          <button onClick={handleSave} disabled={loading} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}>
            {loading ? 'Đang lưu...' : 'Lưu SQL'}
          </button>
        </div>
      </div>
    </div>
  );
}