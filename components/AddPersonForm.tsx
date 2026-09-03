'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Person {
  id: number;
  name: string;
}

interface AddPersonFormProps {
  persons: Person[];
}

export default function AddPersonForm({ persons }: AddPersonFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedDeleteId, setSelectedDeleteId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    fid: '',
    mid: '',
    birth_date: '',
    occupation: '',
    current_address: ''
  });

  // Xử lý Thêm Thành Viên + Upload Ảnh
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let avatarUrl = formData.gender === 'male' 
      ? '/avatars/male.jpg' 
      : '/avatars/female.png';

    // Nếu người dùng có chọn file ảnh từ máy
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        alert('Lỗi upload ảnh: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      avatarUrl = publicUrlData.publicUrl;
    }

    const payload = {
      name: formData.name,
      gender: formData.gender,
      fid: formData.fid ? parseInt(formData.fid) : null,
      mid: formData.mid ? parseInt(formData.mid) : null,
      birth_date: formData.birth_date || null,
      occupation: formData.occupation || null,
      current_address: formData.current_address || null,
      img: avatarUrl
    };

    const { error } = await supabase.from('persons').insert([payload]);
    setLoading(false);

    if (error) {
      alert('Lỗi khi thêm thành viên: ' + error.message);
    } else {
      alert('Thêm thành viên thành công!');
      setIsOpen(false);
      setFile(null);
      setFormData({ name: '', gender: 'male', fid: '', mid: '', birth_date: '', occupation: '', current_address: '' });
      router.refresh();
    }
  };

  // Xử lý Xóa Thành Viên
  const handleDelete = async () => {
    if (!selectedDeleteId) {
      alert('Vui lòng chọn thành viên cần xóa!');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi gia phả?')) {
      setLoading(true);
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', parseInt(selectedDeleteId));

      setLoading(false);

      if (error) {
        alert('Lỗi khi xóa thành viên: ' + error.message);
      } else {
        alert('Đã xóa thành viên thành công!');
        setSelectedDeleteId('');
        router.refresh();
      }
    }
  };

  return (
    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {isOpen ? '✕ Đóng Quản Lý' : '+ Quản Lý Gia Phả (Thêm / Xóa)'}
      </button>

      {isOpen && (
        <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'left', backgroundColor: '#ffffff', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {/* FORM THÊM THÀNH VIÊN */}
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }}>
              Thêm Thành Viên Mới
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Họ và Tên (*):</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Ảnh đại diện (Tải từ máy):</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} style={{ width: '100%', marginTop: '4px' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Giới tính:</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Cha (Cha đẻ):</label>
              <select value={formData.fid} onChange={(e) => setFormData({ ...formData, fid: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">-- Không chọn / Đời 1 --</option>
                {persons.map((p) => (<option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Mẹ (Mẹ đẻ):</label>
              <select value={formData.mid} onChange={(e) => setFormData({ ...formData, mid: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">-- Không chọn / Đời 1 --</option>
                {persons.map((p) => (<option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Nghề nghiệp:</label>
              <input type="text" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
              {loading ? 'Đang lưu...' : 'Lưu Thành Viên'}
            </button>
          </form>

          <hr style={{ margin: '20px 0', borderColor: '#e5e7eb' }} />

          {/* MỤC XÓA THÀNH VIÊN */}
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
              Xóa Thành Viên
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Chọn người cần xóa:</label>
              <select value={selectedDeleteId} onChange={(e) => setSelectedDeleteId(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">-- Chọn thành viên --</option>
                {persons.map((p) => (<option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>))}
              </select>
            </div>
            <button onClick={handleDelete} disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Đang xóa...' : 'Xóa Thành Viên Này'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}