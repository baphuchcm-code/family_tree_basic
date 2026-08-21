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
    // Ưu tiên hiển thị Danh xưng, nếu không có thì ghi [ Họ hàng ] thay vì lấy Nghề nghiệp
    display_subtitle: node.kinship_title 
      ? `[ ${node.kinship_title} ]` 
      : (focusPersonId ? '[ Họ hàng ]' : (node.occupation || 'Thành viên'))
  }));
}, [persons, focusPersonId]);

  return (
    <main className="p-3 sm:p-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-center md:justify-between mb-4 relative min-h-[44px]">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-900 text-white border-2 border-[#D4A017] shadow-xl flex items-center justify-center font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 md:static md:w-auto md:h-auto md:rounded-lg md:bg-white md:text-blue-700 md:px-4 md:py-2 md:text-sm md:shadow-sm"
        >
          <span className="md:hidden text-2xl font-bold leading-none">
            {isSidebarOpen ? '✕' : '+'}
          </span>
          <span className="hidden md:inline">
            {isSidebarOpen ? '◀ Ẩn Thanh Quản Lý' : '☰ Hiện Thanh Quản Lý'}
          </span>
        </button>

        <h1 className="text-[15px] sm:text-xl md:text-2xl font-bold text-slate-800 text-center whitespace-nowrap drop-shadow-sm mx-auto md:mx-0">
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>

        <div className="hidden md:block w-[170px]" />
      </div>

      <div className="flex flex-col md:flex-row gap-5 items-start">
        {isSidebarOpen && (
          <Sidebar
            persons={persons}
            focusPersonId={focusPersonId}
            onSelectFocusPerson={(id) => setFocusPersonId(id)}
            onRefresh={fetchPersons} /* TRUYỀN HÀM NÀY ĐỂ TỰ ĐỘNG CẬP NHẬT GIAO DIỆN KHI XÓA/THÊM */
          />
        )}

        <div className="inner-tree-card flex-1 p-3 w-full overflow-hidden">
          <FamilyTreeComponent nodes={processedNodes} />
        </div>
      </div>
    </main>
  );
}