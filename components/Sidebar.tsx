'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SidebarProps {
  persons: any[];
  focusPersonId: number | null;
  onSelectFocusPerson: (id: number | null) => void;
  onRefresh?: () => void; // Hàm làm mới lại danh sách trên UI
}

export default function Sidebar({ persons, focusPersonId, onSelectFocusPerson, onRefresh }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'update-avatar' | 'delete' | 'kinship'>('add');
  const [loading, setLoading] = useState(false);

  // Form Thêm
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '', 
    gender: 'male', 
    fid: '', 
    mid: '', 
    spouse_id: '', 
    child_id: '',
    occupation: ''
  });

  // Form Đổi Ảnh & Xóa
  const [updateAvatarId, setUpdateAvatarId] = useState('');
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState('');

  // LÀM MỚI DỮ LIỆU
  const triggerRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  // 1. Thêm thành viên mới
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let avatarUrl = formData.gender === 'male' 
      ? 'https://cdn.balkan.app/shared/m10.png' 
      : 'https://cdn.balkan.app/shared/w10.png';

    if (file) {
      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file);
      if (!upErr) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }
    }

    const fidNum = formData.fid ? parseInt(formData.fid) : null;
    const midNum = formData.mid ? parseInt(formData.mid) : null;
    const spouseIdNum = formData.spouse_id ? parseInt(formData.spouse_id) : null;
    const childIdNum = formData.child_id ? parseInt(formData.child_id) : null;

    let assignedGeneration = 1;
    const parentId = fidNum || midNum;
    if (parentId) {
      const parentObj = persons.find(p => p.id === parentId);
      if (parentObj && parentObj.generation) {
        assignedGeneration = Number(parentObj.generation) + 1;
      }
    }

    const pidsArray = spouseIdNum ? [spouseIdNum] : [];

    let insertPayload: any = {
      name: formData.name,
      gender: formData.gender,
      fid: fidNum,
      mid: midNum,
      pids: pidsArray,
      generation: assignedGeneration,
      occupation: formData.occupation || null,
      img: avatarUrl
    };

    let { data: insertedData, error } = await supabase.from('persons').insert([insertPayload]).select();

    if (error && error.message.includes('generation')) {
      delete insertPayload.generation;
      const res = await supabase.from('persons').insert([insertPayload]).select();
      insertedData = res.data;
      error = res.error;
    }

    if (error) {
      alert('Lỗi khi thêm thành viên: ' + error.message);
      setLoading(false);
      return;
    }

    if (insertedData && insertedData[0]) {
      const newPersonId = insertedData[0].id;

      if (spouseIdNum) {
        const spouseObj = persons.find(p => p.id === spouseIdNum);
        const existingPids = Array.isArray(spouseObj?.pids) ? spouseObj.pids : [];
        if (!existingPids.includes(newPersonId)) {
          await supabase
            .from('persons')
            .update({ pids: [...existingPids, newPersonId] })
            .eq('id', spouseIdNum);
        }
      }

      if (childIdNum) {
        const updateField = formData.gender === 'male' ? { fid: newPersonId } : { mid: newPersonId };
        await supabase
          .from('persons')
          .update(updateField)
          .eq('id', childIdNum);
      }
    }

    setLoading(false);
    alert('Thêm thành viên thành công!');
    setFormData({ name: '', gender: 'male', fid: '', mid: '', spouse_id: '', child_id: '', occupation: '' });
    setFile(null);
    triggerRefresh();
  };

  // 2. Cập nhật ảnh đại diện
  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateAvatarId || !updateFile) return alert('Vui lòng chọn thành viên và ảnh!');
    setLoading(true);
    const fileName = `avatar-${updateAvatarId}-${Date.now()}.${updateFile.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, updateFile);
    if (uploadError) {
      alert('Lỗi upload: ' + uploadError.message);
      setLoading(false);
      return;
    }
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await supabase.from('persons').update({ img: publicUrlData.publicUrl }).eq('id', parseInt(updateAvatarId));
    setLoading(false);
    alert('Cập nhật ảnh thành công!');
    setUpdateAvatarId('');
    setUpdateFile(null);
    triggerRefresh();
  };

  // 3. XÓA THÀNH VIÊN (ĐÃ SỬA LỖI)
  const handleDelete = async () => {
    if (!deleteId) return alert('Vui lòng chọn người cần xóa!');
    
    if (confirm('Xác nhận xóa thành viên này khỏi cây gia phả?')) {
      setLoading(true);
      
      const targetId = parseInt(deleteId);

      // Thực hiện xóa trong Supabase
      const { error } = await supabase.from('persons').delete().eq('id', targetId);

      if (error) {
        alert('Lỗi khi xóa thành viên từ Database: ' + error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      alert('Đã xóa thành viên thành công!');
      setDeleteId('');
      
      // Bắt buộc tải lại danh sách trên UI ngay lập tức
      triggerRefresh();
    }
  };

  return (
    <div className="sidebar-card" style={{ padding: '16px', width: '320px', flexShrink: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '16px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
        <button onClick={() => setActiveTab('add')} style={{ padding: '8px 2px', fontSize: '12px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'add' ? '#64E986' : 'transparent', color: activeTab === 'add' ? '#065f46' : '#4b5563' }}>+ Thêm</button>
        <button onClick={() => setActiveTab('update-avatar')} style={{ padding: '8px 2px', fontSize: '12px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'update-avatar' ? '#3b82f6' : 'transparent', color: activeTab === 'update-avatar' ? '#ffffff' : '#4b5563' }}>📷 Ảnh</button>
        <button onClick={() => setActiveTab('delete')} style={{ padding: '8px 2px', fontSize: '12px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'delete' ? '#dc2626' : 'transparent', color: activeTab === 'delete' ? '#ffffff' : '#4b5563' }}>✕ Xóa</button>
        <button onClick={() => setActiveTab('kinship')} style={{ padding: '8px 2px', fontSize: '12px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'kinship' ? '#D4A017' : 'transparent', color: activeTab === 'kinship' ? '#ffffff' : '#4b5563' }}>👑 Danh Xưng</button>
      </div>

      {activeTab === 'add' && (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ margin: 0, color: '#059669', fontSize: '15px', textAlign: 'center' }}>Thêm Thành Viên Mới</h4>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Họ tên (*):</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Giới tính:</label>
            <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Vợ / Chồng:</label>
            <select value={formData.spouse_id} onChange={e => setFormData({ ...formData, spouse_id: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Không chọn --</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Cha đẻ:</label>
            <select value={formData.fid} onChange={e => setFormData({ ...formData, fid: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Không chọn --</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Mẹ đẻ:</label>
            <select value={formData.mid} onChange={e => setFormData({ ...formData, mid: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Không chọn --</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Con đẻ (Nếu có):</label>
            <select value={formData.child_id} onChange={e => setFormData({ ...formData, child_id: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Không chọn --</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Ảnh đại diện:</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', fontSize: '12px' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nghề nghiệp:</label>
            <input type="text" value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '8px', background: '#64E986', color: '#065f46', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
            {loading ? 'Đang lưu...' : 'Lưu Thành Viên'}
          </button>
        </form>
      )}

      {activeTab === 'update-avatar' && (
        <form onSubmit={handleUpdateAvatar} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#2563eb', fontSize: '15px', textAlign: 'center' }}>Cập Nhật Ảnh Thành Viên</h4>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Chọn thành viên:</label>
            <select value={updateAvatarId} onChange={e => setUpdateAvatarId(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Chọn thành viên --</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tải ảnh mới:</label>
            <input type="file" accept="image/*" onChange={e => setUpdateFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', fontSize: '12px' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Đang cập nhật...' : 'Cập Nhật Ảnh'}
          </button>
        </form>
      )}

      {activeTab === 'delete' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#dc2626', fontSize: '15px', textAlign: 'center' }}>Xóa Thành Viên</h4>
          <div>
            <select value={deleteId} onChange={e => setDeleteId(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Chọn thành viên --</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <button onClick={handleDelete} disabled={loading} style={{ padding: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Đang xóa...' : 'Xóa Ngay'}
          </button>
        </div>
      )}

      {activeTab === 'kinship' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#b45309', fontSize: '15px', textAlign: 'center' }}>Tra Cứu Danh Xưng</h4>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Chọn người làm mốc:</label>
            <select value={focusPersonId || ''} onChange={e => onSelectFocusPerson(e.target.value ? parseInt(e.target.value) : null)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #D4A017', fontWeight: 'bold' }}>
              <option value="">-- Mặc định --</option>
              {persons.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          {focusPersonId && (
            <button onClick={() => onSelectFocusPerson(null)} style={{ padding: '6px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
              Đặt lại mặc định
            </button>
          )}
        </div>
      )}
    </div>
  );
}