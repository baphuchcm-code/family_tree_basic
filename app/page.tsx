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
      {/* Thanh Tiêu Đề Top Bar */}
      <div className="flex items-center justify-between mb-4 relative min-h-[44px]">
        {/* Nút bấm Đóng/Mở Sidebar thiết kế đồng bộ với dạng Tab Card */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="z-30 w-10 h-10 bg-white border border-gray-200 text-emerald-600 rounded-lg shadow-sm hover:shadow-md flex items-center justify-center font-bold text-xl cursor-pointer transition-all duration-200 hover:bg-emerald-50 active:scale-95"
          title={isSidebarOpen ? 'Đóng thanh quản lý' : 'Mở thanh quản lý'}
        >
          {isSidebarOpen ? '<' : '+'}
        </button>

        <h1 className="text-[15px] sm:text-xl md:text-2xl font-bold text-slate-800 text-center whitespace-nowrap drop-shadow-sm mx-auto">
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>

        {/* Khoảng trống ẩn để cân bằng bố cục tiêu đề ở giữa */}
        <div className="w-10" />
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-start relative">
        {/* Container Sidebar bên trái tích hợp Hoạt ảnh (Animation) trượt đóng/mở */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
            isSidebarOpen 
              ? 'max-w-[340px] opacity-100 translate-x-0' 
              : 'max-w-0 opacity-0 -translate-x-8 pointer-events-none'
          }`}
        >
          <Sidebar
            persons={persons}
            focusPersonId={focusPersonId}
            onSelectFocusPerson={(id) => setFocusPersonId(id)}
            onRefresh={fetchPersons}
          />
        </div>

        {/* Khu vực hiển thị cây gia phả bên phải */}
        <div className="inner-tree-card flex-1 p-3 w-full overflow-hidden transition-all duration-300">
          <FamilyTreeComponent nodes={processedNodes} />
        </div>
      </div>
    </main>
  );
}