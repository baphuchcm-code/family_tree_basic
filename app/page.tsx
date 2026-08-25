'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FamilyTreeComponent from '@/components/FamilyTree';
import Sidebar from '@/components/Sidebar';
import { calculateKinship } from '@/lib/kinship';

export default function Home() {
  const [persons, setPersons] = useState<any[]>([]);
  const [focusPersonId, setFocusPersonId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      list = calculateKinship(focusPersonId, persons) || persons;
    }

    return list.map(node => ({
      ...node,
      display_subtitle: node.kinship_title 
        ? `[ ${node.kinship_title} ]` 
        : (focusPersonId ? '[ Họ hàng ]' : (node.occupation ? `[ ${node.occupation} ]` : 'Thành viên'))
    }));
  }, [persons, focusPersonId]);

  return (
    <main className="min-h-screen w-full flex flex-col items-center py-6 px-4 gap-6 relative overflow-x-hidden">
      
      {/* 1. Tiêu đề - Căn giữa */}
      {/* ÉP TIÊU ĐỀ BẮT BUỘC RA GIỮA MÀN HÌNH BẰNG INLINE STYLE */}
<div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '20px', paddingBottom: '10px' }}>
  <h1 style={{ textAlign: 'center', width: '100%', margin: 0, fontSize: '28px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#1e293b' }}>
    SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
  </h1>
</div>

      {/* 2. Tab chức năng - Chiếm 40% chiều rộng và nằm ở giữa */}
      {/* BỌC SIDEBAR - ÉP CĂN GIỮA TUYỆT ĐỐI */}
<div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0', position: 'relative', zIndex: 20 }}>
  <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
    <Sidebar
      persons={persons}
      focusPersonId={focusPersonId}
      onSelectFocusPerson={(id) => setFocusPersonId(id)}
      onRefresh={fetchPersons}
    />
  </div>
</div>

      {/* 3. Bảng cây gia phả phía dưới - Viền Gradient #D29F51 -> #008000 */}
      <div className="w-full flex-1 min-h-[600px] rounded-[18px] p-[3px] bg-gradient-to-r from-[#D29F51] to-[#008000] shadow-lg transition-all duration-300">
        <div className="w-full h-full bg-white rounded-[15px] p-3 overflow-hidden flex flex-col">
          <FamilyTreeComponent nodes={processedNodes} />
        </div>
      </div>

    </main>
  );
}