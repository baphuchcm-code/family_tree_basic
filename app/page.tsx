'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import FamilyTreeComponent, { FamilyTree2DRef } from '@/components/FamilyTree';
import Sidebar from '@/components/Sidebar';
import { calculateKinship } from '@/lib/kinship';
import { FamilyTree3DRef } from '@/components/FamilyTree3D';

const FamilyTree3D = dynamic(() => import('@/components/FamilyTree3D'), { ssr: false });

export default function Home() {
  const [persons, setPersons] = useState<any[]>([]);
  const [focusPersonId, setFocusPersonId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const family2DRef = useRef<FamilyTree2DRef>(null);
  const family3DRef = useRef<FamilyTree3DRef>(null);

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
      
      {/* Tiêu đề trang */}
      <div style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 5, pointerEvents: 'auto' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#1e293b', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          SƠ ĐỒ CÂY GIA PHẢ DÒNG HỌ
        </h1>
      </div>

      {/* Cụm nút chuyển 2D/3D, Xuất File & Mở/Tắt Chức năng ở góc dưới bên phải */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 40, display: 'flex', gap: '10px', pointerEvents: 'auto', alignItems: 'center' }}>
        
        {/* NÚT XUẤT FILE VÀ MENU LỰA CHỌN */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: '#0284c7', color: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
          >
            📥 Xuất Gia Phả
          </button>

          {isExportMenuOpen && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '8px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              minWidth: '160px',
              zIndex: 50
            }}>
              {viewMode === '2D' ? (
                <>
                  <button
                    onClick={() => { family2DRef.current?.exportPDF(); setIsExportMenuOpen(false); }}
                    style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}
                  >
                    📄 Xuất file PDF (2D)
                  </button>
                  <button
                    onClick={() => { family2DRef.current?.exportPNG(); setIsExportMenuOpen(false); }}
                    style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}
                  >
                    🖼️ Xuất hình PNG (2D)
                  </button>
                  <button
                    onClick={() => { family2DRef.current?.exportSVG(); setIsExportMenuOpen(false); }}
                    style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}
                  >
                    🎨 Xuất file SVG (2D)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { family3DRef.current?.exportPNG(); setIsExportMenuOpen(false); }}
                  style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}
                >
                  🖼️ Xuất hình PNG (3D)
                </button>
              )}
            </div>
          )}
        </div>

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

      
      {/* Tab chức năng / Thông tin chi tiết nổi (Gọn gàng trong khoảng trống an toàn) */}
      {isSidebarOpen && (
        <div style={{
          position: 'fixed',
          top: '70px',                       // Chừa khoảng trống phía trên cho Tiêu đề & Ô tìm kiếm 3D
          bottom: '80px',                    // Chừa khoảng trống phía dưới cho Cụm nút bấm chức năng
          right: '24px',
          zIndex: 50,
          width: 'calc(100vw - 48px)',
          maxWidth: '380px',                 // Kích thước chiều rộng vừa đủ
          maxHeight: 'calc(100vh - 150px)',   // Giới hạn chiều cao tự động theo màn hình
          overflowY: 'auto',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          backgroundColor: '#ffffff'
        }}>
          <Sidebar
            persons={persons}
            focusPersonId={focusPersonId}
            onSelectFocusPerson={(id) => setFocusPersonId(id)}
            onRefresh={fetchPersons}
          />
        </div>
      )}

      {/* Khung hiển thị Cây Gia Phả */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        {viewMode === '3D' ? (
          <FamilyTree3D ref={family3DRef} persons={persons} focusPersonId={focusPersonId} />
        ) : (
          <FamilyTreeComponent ref={family2DRef} nodes={processedNodes} />
        )}
      </div>

    </main>
  );
}