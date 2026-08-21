'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FamilyTreeComponent from '@/components/FamilyTree';
import Sidebar from '@/components/Sidebar';
import { calculateKinship } from '@/lib/kinship';

export default function Home() {
  const [persons, setPersons] = useState<any[]>([]);
  const [focusPersonId, setFocusPersonId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Trạng thái ẩn/hiện Sidebar

  const fetchPersons = async () => {
    const { data, error } = await supabase.from('persons').select('*');
    if (!error && data) {
      setPersons(data);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const processedNodes = React.useMemo(() => {
    let list = persons;
    if (focusPersonId) {
      list = calculateKinship(focusPersonId, persons);
    }

    return list.map(node => ({
      ...node,
      display_subtitle: node.kinship_title 
        ? `[ ${node.kinship_title} ]` 
        : (node.occupation || 'Thành viên')
    }));
  }, [persons, focusPersonId]);

  return (
    <main style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* TIÊU ĐỀ KHU VỰC VÀ NÚT BẤM ẨN/HIỆN SIDEBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            color: '#1d4ed8',
            border: '2px solid #D4A017',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isSidebarOpen ? '◀ Ẩn Thanh Quản Lý' : '☰ Hiện Thanh Quản Lý'}
        </button>

        <h1 style={{
          fontSize: '26px', fontWeight: 'bold', color: '#1e293b', margin: 0,
          textShadow: '0 2px 4px rgba(255,255,255,0.8)'
        }}>
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>

        <div style={{ width: '140px' }} /> {/* Spacer để căn giữa tiêu đề */}
      </div>

      {/* BỐ CỤC 2 CỘT */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Cột Tab Điều Khiển Bên Trái (Co giãn theo biến isSidebarOpen) */}
        {isSidebarOpen && (
          <Sidebar
            persons={persons}
            focusPersonId={focusPersonId}
            onSelectFocusPerson={(id) => setFocusPersonId(id)}
          />
        )}

        {/* Cột Hiển Thị Cây Gia Phả Bên Phải */}
        <div className="inner-tree-card" style={{ flex: 1, padding: '12px' }}>
          <FamilyTreeComponent nodes={processedNodes} />
        </div>
      </div>
    </main>
  );
}