'use client';
import React, { useEffect, useRef } from 'react';
import FamilyTree from '@balkangraph/familytree.js';

interface FamilyTreeProps {
  nodes: any[];
}

export default function FamilyTreeComponent({ nodes }: FamilyTreeProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current && nodes && nodes.length > 0) {
      divRef.current.innerHTML = ''; // Làm sạch khung trước khi vẽ lại

      const family = new FamilyTree(divRef.current, {
        nodes: nodes,
        nodeBinding: {
          field_0: "name",            // Dòng 1: Họ tên
          field_1: "display_subtitle",// Dòng 2: Nghề nghiệp HOẶC Thứ bậc xưng hô
          img_0: "img"                // Ảnh đại diện
        }
      });
    }
  }, [nodes]);

  return <div ref={divRef} style={{ width: '100%', height: '750px' }} />;
}