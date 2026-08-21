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
      // Thêm "|| persons" hoặc "|| []" để TypeScript hiểu kết quả trả về chắc chắn là mảng
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
    <main className="min-h-screen w-full bg-slate-50 p-4 flex flex-col overflow-hidden">
      
      {/* 1. Tiêu đề chương trình - Căn giữa tuyệt đối trên máy tính */}
      <div className="w-full text-center py-3 mb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 uppercase tracking-wider drop-shadow-sm">
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>
      </div>

      {/* 2. Bố cục Ngang: Tab quản lý bên trái, Cây gia phả bên phải */}
      <div className="flex-1 flex flex-row items-start gap-3 w-full h-full relative">


        {/* Khối Tab phụ (Sidebar) bên trái */}
        {/* Khối Tab phụ (Sidebar) bên trái */}
<div
  className={`transition-all duration-300 ease-in-out flex-shrink-0 z-20 overflow-hidden ${
    isSidebarOpen 
      ? 'w-[360px] opacity-100 translate-x-0 mr-3' 
      : 'w-0 opacity-0 -translate-x-6 pointer-events-none mr-0'
  }`}
>
  {/* Thẻ bên trong BẮT BUỘC có w-[360px] để nội dung không bị ép co rúm khi đang trượt */}
  <div className="w-[360px]">
    <Sidebar
      persons={persons}
      focusPersonId={focusPersonId}
      onSelectFocusPerson={(id) => setFocusPersonId(id)}
      onRefresh={fetchPersons}
    />
  </div>
</div>

        {/* Bảng đồ gia phả luôn nằm bên phải Tab phụ */}
        <div className="flex-1 h-full min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 transition-all duration-300 overflow-hidden">
          <FamilyTreeComponent nodes={processedNodes} />
        </div>

      </div>

    </main>
  );
}