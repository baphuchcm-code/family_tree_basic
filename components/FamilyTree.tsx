'use client';
import React, { useEffect, useRef } from 'react';
import FamilyTree from '@balkangraph/familytree.js';

interface FamilyTreeProps {
  nodes: any[];
}

export default function FamilyTreeComponent({ nodes }: FamilyTreeProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current || !nodes || nodes.length === 0) return;

    divRef.current.innerHTML = ''; // Làm sạch khung trước khi vẽ lại

    const family = new FamilyTree(divRef.current, {
      nodes: nodes,
      nodeBinding: {
        field_0: "name",            // Dòng 1: Họ tên
        field_1: "display_subtitle",// Dòng 2: Nghề nghiệp HOẶC Thứ bậc xưng hô
        img_0: "img"                // Ảnh đại diện
      }
    });

    // Hàm tách ô tìm kiếm ra khỏi container của Balkan JS và định vị cố định
    const relocateSearchBox = () => {
      const searchEl = (divRef.current?.querySelector('[control-search]') || 
                        document.querySelector('[control-search]')) as HTMLElement;
      
      if (searchEl) {
        // Gắn ô tìm kiếm ra ngoài document.body để không bị ảnh hưởng bởi transform/zoom của sơ đồ
        if (searchEl.parentElement !== document.body) {
          document.body.appendChild(searchEl);
        }

        // Ép vị trí cố định ở góc dưới bên trái màn hình
        searchEl.style.cssText = `
          position: fixed !important;
          bottom: 24px !important;
          left: 24px !important;
          top: auto !important;
          right: auto !important;
          z-index: 99999 !important;
          margin: 0 !important;
        `;
      }
    };

    // 1. Tự động lắng nghe DOM bằng MutationObserver khi Balkan JS chèn nút tìm kiếm
    const observer = new MutationObserver(() => {
      relocateSearchBox();
    });

    observer.observe(divRef.current, {
      childList: true,
      subtree: true
    });

    // 2. Chạy kiểm tra sau khoảng thời gian ngắn để đảm bảo không bị sót
    const timer1 = setTimeout(relocateSearchBox, 50);
    const timer2 = setTimeout(relocateSearchBox, 300);

    // Dọn dẹp DOM khi chuyển trang/unmount component
    return () => {
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
      const orphanSearch = document.querySelector('body > [control-search]');
      if (orphanSearch) {
        orphanSearch.remove();
      }
    };
  }, [nodes]);

  return <div ref={divRef} style={{ width: '100%', height: '100%', background: 'transparent' }} />;
}