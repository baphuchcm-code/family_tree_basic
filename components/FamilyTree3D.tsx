'use client';
import React, { useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

interface FamilyTree3DProps {
  persons: any[];
  focusPersonId?: number | null;
}

export default function FamilyTree3D({ persons, focusPersonId }: FamilyTree3DProps) {
  const fgRef = useRef<any>(null);

  // 1. Chuyển đổi dữ liệu persons thành Node và Link 3D
  const graphData = React.useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];

    persons.forEach(p => {
      nodes.push({
        id: p.id,
        name: p.name,
        img: p.img,
        birth_order: p.birth_order,
        gender: p.gender,
        occupation: p.occupation
      });

      // Liên kết Cha -> Con
      if (p.fid) {
        links.push({ source: p.fid, target: p.id, type: 'parent-child', color: '#10b981' });
      }
      // Liên kết Mẹ -> Con
      if (p.mid) {
        links.push({ source: p.mid, target: p.id, type: 'parent-child', color: '#ec4899' });
      }
      // Liên kết Vợ / Chồng
      if (Array.isArray(p.pids)) {
        p.pids.forEach((spouseId: number) => {
          if (p.id < spouseId) { // Tránh trùng lặp link 2 chiều
            links.push({ source: p.id, target: spouseId, type: 'spouse', color: '#f59e0b' });
          }
        });
      }
    });

    return { nodes, links };
  }, [persons]);

  // 2. Tạo hình thể 3D cho từng thành viên (Khối tròn có dán ảnh đại diện)
  const createNodeObject = useCallback((node: any) => {
    const group = new THREE.Group();

    // Khối cầu nền
    const geometry = new THREE.SphereGeometry(7, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: node.id === focusPersonId ? 0xd97706 : (node.gender === 'male' ? 0x2563eb : 0xdb2777)
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Dán ảnh đại diện lên mặt trước Node
    if (node.img) {
      const loader = new THREE.TextureLoader();
      loader.load(node.img, (texture) => {
        const imgGeo = new THREE.CircleGeometry(6, 32);
        const imgMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const imgMesh = new THREE.Mesh(imgGeo, imgMat);
        imgMesh.position.z = 7.1; // Nổi lên mặt trước
        group.add(imgMesh);
      });
    }

    // Canvas vẽ nhãn tên & thứ bậc dạng 3D
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'Bold 20px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      const labelText = `${node.name} ${node.birth_order ? `(${node.birth_order})` : ''}`;
      ctx.fillText(labelText, 128, 40);
    }
    const textTexture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: textTexture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, -12, 0);
    sprite.scale.set(20, 5, 1);
    group.add(sprite);

    return group;
  }, [focusPersonId]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '650px', background: '#050b14', borderRadius: '15px', overflow: 'hidden' }}>
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeThreeObject={createNodeObject}
        linkWidth={2}
        linkColor={(link: any) => link.color || '#ffffff'}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={3}
        dagMode="td" // Sắp xếp dạng cây từ trên xuống dưới theo thế hệ
        dagLevelDistance={50}
        backgroundColor="#050b14"
        onNodeClick={(node: any) => {
          // Phóng to camera vào Node khi nhấp chọn
          const distance = 40;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          fgRef.current?.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node,
            2000
          );
        }}
      />
    </div>
  );
}