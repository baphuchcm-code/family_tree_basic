'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import FamilyTreeComponent from '@/components/FamilyTree';
import Sidebar from '@/components/Sidebar';
import { calculateKinship } from '@/lib/kinship';

// Tải động Component 3D để tránh lỗi Render phía Server
const FamilyTree3D = dynamic(() => import('@/components/FamilyTree3D'), { ssr: false });

export default function Home() {
  const [persons, setPersons] = useState<any[]>([]);
  const [focusPersonId, setFocusPersonId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D'); // Mặc định chế độ 3D

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
    <main className="min-h-screen w-full flex flex-col items-center py-6 px-4 gap-6 relative overflow-x-hidden">
      
      {/* Tiêu đề căn giữa tuyệt đối */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ textAlign: 'center', margin: 0, fontSize: '28px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#1e293b' }}>
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>
      </div>

      {/* Nút chuyển đổi 2D / 3D */}
      <div style={{ display: 'flex', gap: '10px', zIndex: 30 }}>
        <button
          onClick={() => setViewMode('2D')}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: viewMode === '2D' ? '#059669' : '#e5e7eb', color: viewMode === '2D' ? '#fff' : '#374151' }}
        >
          📄 Chế độ 2D
        </button>
        <button
          onClick={() => setViewMode('3D')}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: viewMode === '3D' ? '#7c3aed' : '#e5e7eb', color: viewMode === '3D' ? '#fff' : '#374151' }}
        >
          🌐 Bản đồ 3D
        </button>
      </div>

      {/* Tab chức năng */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', zIndex: 20 }}>
        <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
          <Sidebar
            persons={persons}
            focusPersonId={focusPersonId}
            onSelectFocusPerson={(id) => setFocusPersonId(id)}
            onRefresh={fetchPersons}
          />
        </div>
      </div>

      {/* Khung hiển thị Cây Gia Phả 2D hoặc Bản Đồ 3D */}
      <div className="w-full flex-1 min-h-[650px] rounded-[18px] p-[3px] bg-gradient-to-r from-[#D29F51] to-[#008000] shadow-lg">
        <div className="w-full h-full bg-white rounded-[15px] p-2 overflow-hidden flex flex-col">
          {viewMode === '3D' ? (
            <FamilyTree3D persons={persons} focusPersonId={focusPersonId} />
          ) : (
            <FamilyTreeComponent nodes={processedNodes} />
          )}
        </div>
      </div>

    </main>
  );
}