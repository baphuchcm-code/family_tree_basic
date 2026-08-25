'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SidebarProps {
  persons: any[];
  focusPersonId: number | null;
  onSelectFocusPerson: (id: number | null) => void;
  onRefresh?: () => void;
}

// Component chọn thành viên thông minh: Hỗ trợ gõ tên tìm kiếm gần đúng
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- Gõ tên hoặc chọn thành viên --"
}: {
  options: any[];
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => String(o.id) === String(value));

  // Cập nhật ô nhập khi thay đổi người được chọn
  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(`${selectedOption.name}${selectedOption.birth_order ? ` (${selectedOption.birth_order})` : ''}`);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, options]);

  // Đóng danh sách gợi ý khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tìm kiếm gần đúng theo tên, thứ bậc hoặc ID
  const filteredOptions = options.filter(p => {
    const searchTarget = `${p.name} ${p.birth_order || ''} ${p.id}`.toLowerCase();
    return searchTarget.includes(searchTerm.toLowerCase());
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (value && e.target.value === '') {
              onChange('');
            }
          }}
          style={{
            width: '100%',
            padding: '6px 26px 6px 8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '12px',
            outline: 'none'
          }}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSearchTerm('');
              setIsOpen(false);
            }}
            style={{
              position: 'absolute',
              right: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '180px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            zIndex: 100,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            marginTop: '2px'
          }}
        >
          <div
            onClick={() => {
              onChange('');
              setSearchTerm('');
              setIsOpen(false);
            }}
            style={{ padding: '6px 8px', cursor: 'pointer', fontSize: '12px', color: '#666', fontStyle: 'italic', borderBottom: '1px solid #eee' }}
          >
            -- Không chọn --
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  onChange(String(p.id));
                  setSearchTerm(`${p.name}${p.birth_order ? ` (${p.birth_order})` : ''}`);
                  setIsOpen(false);
                }}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: String(value) === String(p.id) ? '#eff6ff' : 'white'
                }}
              >
                <strong style={{ color: '#1e293b' }}>{p.name}</strong>{' '}
                {p.birth_order && <span style={{ color: '#7c3aed', fontSize: '11px' }}>({p.birth_order})</span>}{' '}
                <span style={{ color: '#9ca3af', fontSize: '10px' }}>(ID: {p.id})</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '8px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
              Không tìm thấy thành viên phù hợp
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ persons, focusPersonId, onSelectFocusPerson, onRefresh }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'update-avatar' | 'update-order' | 'delete' | 'kinship'>('add');
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
    occupation: '',
    birth_order: ''
  });

  // Form Cập nhật Thứ bậc
  const [editPersonId, setEditPersonId] = useState('');
  const [editBirthOrder, setEditBirthOrder] = useState('');

  // Form Đổi Ảnh & Xóa
  const [updateAvatarId, setUpdateAvatarId] = useState('');
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState('');

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
      birth_order: formData.birth_order || null,
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
    setFormData({ name: '', gender: 'male', fid: '', mid: '', spouse_id: '', child_id: '', occupation: '', birth_order: '' });
    setFile(null);
    triggerRefresh();
  };

  // 2. Cập nhật thứ bậc
  const handleUpdateBirthOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPersonId) return alert('Vui lòng chọn thành viên!');
    setLoading(true);

    const { error } = await supabase
      .from('persons')
      .update({ birth_order: editBirthOrder || null })
      .eq('id', parseInt(editPersonId));

    setLoading(false);
    if (error) {
      alert('Lỗi cập nhật thứ bậc: ' + error.message);
    } else {
      alert('Cập nhật thứ bậc thành công!');
      setEditPersonId('');
      setEditBirthOrder('');
      triggerRefresh();
    }
  };

  // 3. Cập nhật ảnh
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

  // 4. Xóa thành viên
  const handleDelete = async () => {
    if (!deleteId) return alert('Vui lòng chọn người cần xóa!');
    
    if (confirm('Xác nhận xóa thành viên này khỏi cây gia phả?')) {
      setLoading(true);
      const targetId = parseInt(deleteId);
      const { error } = await supabase.from('persons').delete().eq('id', targetId);

      if (error) {
        alert('Lỗi khi xóa thành viên: ' + error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      alert('Đã xóa thành viên thành công!');
      setDeleteId('');
      triggerRefresh();
    }
  };

  return (
    <div className="sidebar-card" style={{ padding: '16px', width: '80%', maxWidth: '480px', margin: '0 auto' }}>
      {/* 5 Thanh Tab chuyển đổi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '16px', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
        <button onClick={() => setActiveTab('add')} style={{ padding: '8px 2px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'add' ? '#64E986' : 'transparent', color: activeTab === 'add' ? '#065f46' : '#4b5563' }}>+ Thêm</button>
        <button onClick={() => setActiveTab('update-order')} style={{ padding: '8px 2px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'update-order' ? '#8b5cf6' : 'transparent', color: activeTab === 'update-order' ? '#ffffff' : '#4b5563' }}>🏷️ Thứ Bậc</button>
        <button onClick={() => setActiveTab('update-avatar')} style={{ padding: '8px 2px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'update-avatar' ? '#3b82f6' : 'transparent', color: activeTab === 'update-avatar' ? '#ffffff' : '#4b5563' }}>📷 Ảnh</button>
        <button onClick={() => setActiveTab('delete')} style={{ padding: '8px 2px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'delete' ? '#dc2626' : 'transparent', color: activeTab === 'delete' ? '#ffffff' : '#4b5563' }}>✕ Xóa</button>
        <button onClick={() => setActiveTab('kinship')} style={{ padding: '8px 2px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'kinship' ? '#D4A017' : 'transparent', color: activeTab === 'kinship' ? '#ffffff' : '#4b5563' }}>👑 Danh Xưng</button>
      </div>

      {/* Tab 1: THÊM THÀNH VIÊN */}
      {activeTab === 'add' && (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ margin: 0, color: '#059669', fontSize: '15px', textAlign: 'center' }}>Thêm Thành Viên Mới</h4>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Họ tên (*):</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Thứ bậc (VD: Anh cả, Chị tư...):</label>
            <input type="text" placeholder="VD: Anh cả, Chị hai..." value={formData.birth_order} onChange={e => setFormData({ ...formData, birth_order: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Giới tính:</label>
            <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Vợ / Chồng:</label>
            <SearchableSelect options={persons} value={formData.spouse_id} onChange={(id) => setFormData({ ...formData, spouse_id: id })} placeholder="Gõ tên tìm Vợ / Chồng..." />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Cha đẻ:</label>
            <SearchableSelect options={persons} value={formData.fid} onChange={(id) => setFormData({ ...formData, fid: id })} placeholder="Gõ tên tìm Cha đẻ..." />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Mẹ đẻ:</label>
            <SearchableSelect options={persons} value={formData.mid} onChange={(id) => setFormData({ ...formData, mid: id })} placeholder="Gõ tên tìm Mẹ đẻ..." />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Con đẻ (Nếu có):</label>
            <SearchableSelect options={persons} value={formData.child_id} onChange={(id) => setFormData({ ...formData, child_id: id })} placeholder="Gõ tên tìm Con đẻ..." />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Ảnh đại diện:</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', fontSize: '12px' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nghề nghiệp:</label>
            <input type="text" value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '8px', background: '#64E986', color: '#065f46', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
            {loading ? 'Đang lưu...' : 'Lưu Thành Viên'}
          </button>
        </form>
      )}

      {/* Tab 2: SỬA THỨ BẬC */}
      {activeTab === 'update-order' && (
        <form onSubmit={handleUpdateBirthOrder} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#7c3aed', fontSize: '15px', textAlign: 'center' }}>Sửa Thứ Bậc Thành Viên</h4>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Chọn thành viên:</label>
            <SearchableSelect 
              options={persons} 
              value={editPersonId} 
              onChange={(id) => {
                setEditPersonId(id);
                const found = persons.find(p => String(p.id) === String(id));
                setEditBirthOrder(found?.birth_order || '');
              }} 
              placeholder="Gõ tên thành viên..." 
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Thứ bậc mới:</label>
            <input 
              type="text" 
              placeholder="VD: Anh cả, Chị hai, Em út..." 
              value={editBirthOrder} 
              onChange={e => setEditBirthOrder(e.target.value)} 
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }} 
            />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '8px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Đang cập nhật...' : 'Cập Nhật Thứ Bậc'}
          </button>
        </form>
      )}

      {/* Tab 3: CẬP NHẬT ẢNH */}
      {activeTab === 'update-avatar' && (
        <form onSubmit={handleUpdateAvatar} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#2563eb', fontSize: '15px', textAlign: 'center' }}>Cập Nhật Ảnh Thành Viên</h4>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Chọn thành viên:</label>
            <SearchableSelect options={persons} value={updateAvatarId} onChange={(id) => setUpdateAvatarId(id)} placeholder="Gõ tên thành viên..." />
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

      {/* Tab 4: XÓA */}
      {activeTab === 'delete' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#dc2626', fontSize: '15px', textAlign: 'center' }}>Xóa Thành Viên</h4>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Chọn thành viên muốn xóa:</label>
            <SearchableSelect options={persons} value={deleteId} onChange={(id) => setDeleteId(id)} placeholder="Gõ tên người muốn xóa..." />
          </div>
          <button onClick={handleDelete} disabled={loading} style={{ padding: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Đang xóa...' : 'Xóa Ngay'}
          </button>
        </div>
      )}

      {/* Tab 5: DANH XƯNG */}
      {activeTab === 'kinship' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#b45309', fontSize: '15px', textAlign: 'center' }}>Tra Cứu Danh Xưng</h4>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Chọn người làm mốc:</label>
            <SearchableSelect options={persons} value={focusPersonId || ''} onChange={(id) => onSelectFocusPerson(id ? parseInt(id) : null)} placeholder="Gõ tên người làm mốc..." />
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