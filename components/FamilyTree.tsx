'use client';
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import FamilyTree from '@balkangraph/familytree.js';

interface FamilyTreeProps {
  nodes: any[];
}

export interface FamilyTree2DRef {
  exportPDF: () => void;
  exportPNG: () => void;
  exportSVG: () => void;
}

const FamilyTreeComponent = forwardRef<FamilyTree2DRef, FamilyTreeProps>(({ nodes }, ref) => {
  const divRef = useRef<HTMLDivElement>(null);
  const familyInstanceRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    exportPDF: () => {
      if (familyInstanceRef.current) {
        familyInstanceRef.current.exportPDF({ filename: 'Gia_Pha_2D.pdf', expandUI: true, fit: true });
      }
    },
    exportPNG: () => {
      if (familyInstanceRef.current) {
        familyInstanceRef.current.exportPNG({ filename: 'Gia_Pha_2D.png', expandUI: true, fit: true });
      }
    },
    exportSVG: () => {
      if (familyInstanceRef.current) {
        familyInstanceRef.current.exportSVG({ filename: 'Gia_Pha_2D.svg', expandUI: true, fit: true });
      }
    }
  }));

  useEffect(() => {
    if (!divRef.current || !nodes || nodes.length === 0) return;

    divRef.current.innerHTML = '';

    const family = new FamilyTree(divRef.current, {
      nodes: nodes,
      nodeBinding: {
        field_0: "name",
        field_1: "display_subtitle",
        img_0: "img"
      }
    });

    familyInstanceRef.current = family;

    const relocateSearchBox = () => {
      const searchEl = (divRef.current?.querySelector('[control-search]') || 
                        document.querySelector('[control-search]')) as HTMLElement;
      
      if (searchEl) {
        if (searchEl.parentElement !== document.body) {
          document.body.appendChild(searchEl);
        }

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

    const observer = new MutationObserver(() => {
      relocateSearchBox();
    });

    observer.observe(divRef.current, {
      childList: true,
      subtree: true
    });

    const timer1 = setTimeout(relocateSearchBox, 50);
    const timer2 = setTimeout(relocateSearchBox, 300);

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

  return (
    <>
      {/* CSS đè trực tiếp để giới hạn kích thước Form chi tiết Balkan JS */}
      <style jsx global>{`
        .bft-edit-form, [control-node-menu] {
          top: 70px !important;
          bottom: 80px !important;
          max-height: calc(100vh - 150px) !important;
          right: 24px !important;
          width: 360px !important;
          max-width: 90vw !important;
          overflow-y: auto !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
        }
      `}</style>
      <div ref={divRef} style={{ width: '100%', height: '100%', background: 'transparent' }} />
    </>
  );
});

FamilyTreeComponent.displayName = 'FamilyTreeComponent';
export default FamilyTreeComponent;