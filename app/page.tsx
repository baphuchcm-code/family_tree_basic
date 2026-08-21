'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FamilyTreeComponent from '@/components/FamilyTree';
import Sidebar from '@/components/Sidebar';
import { calculateKinship } from '@/lib/kinship';

export default function Home() {
  const [persons, setPersons] = useState<any[]>([]);
  const [focusPersonId, setFocusPersonId] = useState<number | null>(null);

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
      // Khi chọn người trung tâm, ưu tiên hiển thị danh xưng. Nếu người đó nằm ngoài phạm vi tính toán thì hiện [ Họ hàng ] thay vì lấy Nghề nghiệp
      display_subtitle: node.kinship_title 
        ? `[ ${node.kinship_title} ]` 
        : (focusPersonId ? '[ Họ hàng ]' : (node.occupation ? `[ ${node.occupation} ]` : 'Thành viên'))
    }));
  }, [persons, focusPersonId]);

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start p-3 sm:p-6 bg-slate-50 overflow-x-hidden">
      {/* 1. Tiêu đề chương trình - Căn giữa hoàn toàn */}
      <header className="w-full max-w-4xl text-center my-4 sm:my-6">
        <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 uppercase tracking-wide drop-shadow-sm">
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>
      </header>

      {/* 2. Cấu trúc bố cục chính */}
      <div className="w-full max-w-[1600px] flex flex-col items-center gap-6">
        {/* Khối quản lý (Tab Thêm / Sidebar) - Căn giữa màn hình trên mọi thiết bị */}
        <div className="w-full max-w-md md:max-w-lg mx-auto z-20">
          <Sidebar
            persons={persons}
            focusPersonId={focusPersonId}
            onSelectFocusPerson={(id) => setFocusPersonId(id)}
            onRefresh={fetchPersons}
          />
        </div>

        {/* Bảng Sơ đồ Cây gia phả */}
        <div className="inner-tree-card w-full p-3 sm:p-5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <FamilyTreeComponent nodes={processedNodes} />
        </div>
      </div>
    </main>
  );
}