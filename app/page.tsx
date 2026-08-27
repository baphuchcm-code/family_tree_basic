'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import FamilyTreeComponent from '@/components/FamilyTree';
import Sidebar from '@/components/Sidebar';
import { calculateKinship } from '@/lib/kinship';

// Tải động Component 3D
const FamilyTree3D = dynamic(() => import('@/components/FamilyTree3D'), { ssr: false });

export default function Home() {
  const [persons, setPersons] = useState<any[]>([]);
  const [focusPersonId, setFocusPersonId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mặc định tắt bảng chức năng
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');

  const fetchPersons = async () => {
    const { data, error } = await supabase.from('persons').select('*');
    if (!error && data) setPersons(data);
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const processedNodes = React.useMemo(() => {
    let list = persons;
    if (focusPersonId) {
      list = calculateKinship(focusPersonId, persons) || persons;
    }
    return list.map(node => ({
      ...node,
      display_subtitle: `${node.birth_order ? `(${node.birth_order}) ` : ''}${node.kinship_title ? `[ ${node.kinship_title} ]` : 'Thành viên'}`
    }));
  }, [persons, focusPersonId]);

  return (
    <main className="w-screen h-screen relative overflow-hidden">
      
      {/* Tiêu đề trang ở góc trên bên trái */}
      <div style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 40, pointerEvents: 'auto' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#1e293b', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>
      </div>

      {/* Cụm nút chuyển 2D/3D & Mở/Tắt Chức năng (ĐÃ CHUYỂN XUỐNG GÓC DƯỚI BÊN PHẢI) */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 40, display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
        <button
          onClick={() => setViewMode('2D')}
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: viewMode === '2D' ? '#059669' : 'rgba(255, 255, 255, 0.85)', color: viewMode === '2D' ? '#fff' : '#374151', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          📄 Chế độ 2D
        </button>
        <button
          onClick={() => setViewMode('3D')}
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: viewMode === '3D' ? '#7c3aed' : 'rgba(255, 255, 255, 0.85)', color: viewMode === '3D' ? '#fff' : '#374151', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          🌐 Bản đồ 3D
        </button>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: isSidebarOpen ? '#dc2626' : '#d97706', color: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
        >
          {isSidebarOpen ? '✖ Đóng Chức Năng' : '⚙️ Mở Chức Năng'}
        </button>
      </div>

      {/* Tab chức năng hiển thị dạng bảng nổi (Hiển thị phía trên cụm nút điều khiển) */}
      {isSidebarOpen && (
        <div style={{ position: 'fixed', bottom: '80px', right: '24px', zIndex: 50, width: '90vw', maxWidth: '480px', maxHeight: '75vh', overflowY: 'auto', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <Sidebar
            persons={persons}
            focusPersonId={focusPersonId}
            onSelectFocusPerson={(id) => setFocusPersonId(id)}
            onRefresh={fetchPersons}
          />
        </div>
      )}

      {/* Cây Gia Phả tràn toàn bộ màn hình phía sau */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        {viewMode === '3D' ? (
          <FamilyTree3D persons={persons} focusPersonId={focusPersonId} />
        ) : (
          <FamilyTreeComponent nodes={processedNodes} />
        )}
      </div>

    </main>
  );
}