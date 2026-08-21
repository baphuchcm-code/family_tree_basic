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
    <main className="p-3 sm:p-5 max-w-[1600px] mx-auto min-h-screen">
      {/* Tiêu đề chính của trang */}
      <div className="mb-4 text-center">
        <h1 className="text-lg sm:text-2xl font-bold text-slate-800 uppercase tracking-wide drop-shadow-sm">
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start relative">
        {/* Khối quản lý nằm bên trái bao gồm Nút Bấm thiết kế dạng Tab + Sidebar */}
        <div className="flex items-start gap-2 flex-shrink-0 z-20">
          {/* Nút bấm Ẩn/Hiện Tab: Đồng bộ thiết kế với các nút Tab (+ Thêm, Ảnh, Xóa...) */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              backgroundColor: '#f3f4f6',
              color: isSidebarOpen ? '#dc2626' : '#059669',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
            }}
            className="hover:bg-gray-200 active:scale-95"
            title={isSidebarOpen ? 'Đóng thanh quản lý' : 'Mở thanh quản lý'}
          >
            {isSidebarOpen ? '<' : '+'}
          </button>

          {/* Thanh Sidebar quản lý chứa hoạt ảnh trượt mượt mà (Slide & Fade) */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isSidebarOpen 
                ? 'max-w-[340px] opacity-100 translate-x-0' 
                : 'max-w-0 opacity-0 -translate-x-6 pointer-events-none'
            }`}
          >
            <Sidebar
              persons={persons}
              focusPersonId={focusPersonId}
              onSelectFocusPerson={(id) => setFocusPersonId(id)}
              onRefresh={fetchPersons}
            />
          </div>
        </div>

        {/* Bảng Sơ đồ Cây gia phả nằm cố định bên phải */}
        <div className="inner-tree-card flex-1 p-3 w-full overflow-hidden transition-all duration-300">
          <FamilyTreeComponent nodes={processedNodes} />
        </div>
      </div>
    </main>
  );
}