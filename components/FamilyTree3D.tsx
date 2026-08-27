'use client';
import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

interface FamilyTree3DProps {
  persons: any[];
  focusPersonId?: number | null;
}

export default function FamilyTree3D({ persons = [], focusPersonId }: FamilyTree3DProps) {
  const fgRef = useRef<any>(null);

  const [selectedSearchId, setSelectedSearchId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Thuật toán xác định Người được chọn & Người Thân Gần
  const { mainHighlightId, relativeIdsSet } = useMemo(() => {
    const activeId = selectedSearchId || focusPersonId || null;
    if (!activeId) return { mainHighlightId: null, relativeIdsSet: new Set<number>() };

    const target = persons.find(p => Number(p.id) === Number(activeId));
    const relSet = new Set<number>();

    if (target) {
      const targetFid = target.fid ? Number(target.fid) : null;
      const targetMid = target.mid ? Number(target.mid) : null;

      if (targetFid) relSet.add(targetFid);
      if (targetMid) relSet.add(targetMid);

      if (Array.isArray(target.pids)) {
        target.pids.forEach((sId: any) => relSet.add(Number(sId)));
      }

      persons.forEach(p => {
        const pId = Number(p.id);
        if (pId === Number(activeId)) return;

        const pFid = p.fid ? Number(p.fid) : null;
        const pMid = p.mid ? Number(p.mid) : null;

        if (pFid === Number(activeId) || pMid === Number(activeId)) {
          relSet.add(pId);
        }

        if (targetFid && targetMid && pFid === targetFid && pMid === targetMid) {
          relSet.add(pId);
        }
      });
    }

    return { mainHighlightId: Number(activeId), relativeIdsSet: relSet };
  }, [selectedSearchId, focusPersonId, persons]);

  // 2. Chuyển đổi dữ liệu persons thành Node và Link 3D
  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const validNodeIds = new Set(persons.map((p: any) => Number(p.id)));

    persons.forEach((p: any) => {
      const currentId = Number(p.id);

      nodes.push({
        id: currentId,
        name: p.name,
        img: p.img,
        birth_order: p.birth_order,
        gender: p.gender,
        occupation: p.occupation
      });

      if (p.fid && validNodeIds.has(Number(p.fid))) {
        links.push({ source: Number(p.fid), target: currentId, type: 'parent-child', color: '#10b981' });
      }
      if (p.mid && validNodeIds.has(Number(p.mid))) {
        links.push({ source: Number(p.mid), target: currentId, type: 'parent-child', color: '#ec4899' });
      }
      if (Array.isArray(p.pids)) {
        p.pids.forEach((spouseId: any) => {
          const sId = Number(spouseId);
          if (validNodeIds.has(sId) && currentId < sId) {
            links.push({ source: currentId, target: sId, type: 'spouse', color: '#f59e0b' });
          }
        });
      }
    });

    for (let i = 0; i < persons.length; i++) {
      for (let j = i + 1; j < persons.length; j++) {
        const p1 = persons[i];
        const p2 = persons[j];
        if (p1.fid && p1.mid && p2.fid && p2.mid) {
          if (Number(p1.fid) === Number(p2.fid) && Number(p1.mid) === Number(p2.mid)) {
            const id1 = Number(p1.id);
            const id2 = Number(p2.id);
            if (validNodeIds.has(id1) && validNodeIds.has(id2)) {
              links.push({ source: id1, target: id2, type: 'sibling', color: '#8b5cf6' });
            }
          }
        }
      }
    }

    return { nodes, links };
  }, [persons]);

  // 3. Trải đều các nút có liên hệ xung quanh nút được chọn
  const spreadConnectedNodes = useCallback((targetId: number, relSet: Set<number>) => {
    const targetNode = graphData.nodes.find((n: any) => n.id === targetId);
    if (!targetNode) return;

    graphData.nodes.forEach((n: any) => {
      delete n.fx;
      delete n.fy;
      delete n.fz;
    });

    const relativeNodes = graphData.nodes.filter((n: any) => relSet.has(n.id));
    const totalRelatives = relativeNodes.length;

    if (totalRelatives > 0) {
      const spreadRadius = 75;
      relativeNodes.forEach((node: any, index: number) => {
        const angle = (index / totalRelatives) * 2 * Math.PI;
        node.fx = (targetNode.x || 0) + spreadRadius * Math.cos(angle);
        node.fy = (targetNode.y || 0) + spreadRadius * Math.sin(angle);
        node.fz = targetNode.z || 0;
      });

      targetNode.fx = targetNode.x || 0;
      targetNode.fy = targetNode.y || 0;
      targetNode.fz = targetNode.z || 0;

      fgRef.current?.d3ReheatSimulation();
    }
  }, [graphData]);

  const resetSpreadNodes = useCallback(() => {
    graphData.nodes.forEach((n: any) => {
      delete n.fx;
      delete n.fy;
      delete n.fz;
    });
    fgRef.current?.d3ReheatSimulation();
  }, [graphData]);

  const zoomToNode = useCallback((nodeId: number) => {
    const node = graphData.nodes.find((n: any) => n.id === nodeId);
    if (node) {
      const distance = 40;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const z = node.z ?? 0;
      const distRatio = 1 + distance / Math.hypot(x || 1, y || 1, z || 1);

      fgRef.current?.cameraPosition(
        { x: x * distRatio, y: y * distRatio, z: z * distRatio },
        node,
        2000
      );
    }
  }, [graphData]);

  const handleSelectNode = useCallback((nodeId: number, relSet: Set<number>) => {
    setSelectedSearchId(nodeId);
    spreadConnectedNodes(nodeId, relSet);
    zoomToNode(nodeId);
  }, [spreadConnectedNodes, zoomToNode]);

  // 4. Phối màu & Dựng đối tượng 3D
  const createNodeObject = useCallback((node: any) => {
    const group = new THREE.Group();

    let sphereColor = node.gender === 'male' ? 0x2563eb : 0xdb2777;
    let sphereRadius = 7;
    let opacity = 1.0;

    if (mainHighlightId) {
      if (node.id === mainHighlightId) {
        sphereColor = 0xf59e0b;
        sphereRadius = 9.5;
      } else if (relativeIdsSet.has(node.id)) {
        sphereColor = 0x10b981;
        sphereRadius = 8;
      } else {
        sphereColor = 0x334155;
        opacity = 0.35;
      }
    }

    const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: sphereColor,
      transparent: opacity < 1.0,
      opacity: opacity
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    if (node.img) {
      const loader = new THREE.TextureLoader();
      loader.load(node.img, (texture) => {
        const spriteMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: opacity < 1.0,
          opacity: opacity,
          depthTest: false
        });
        const avatarSprite = new THREE.Sprite(spriteMat);
        avatarSprite.position.set(0, 0, 0);
        avatarSprite.scale.set((sphereRadius - 1.2) * 2, (sphereRadius - 1.2) * 2, 1);
        avatarSprite.renderOrder = 10;
        group.add(avatarSprite);
      });
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    if (ctx) {
      ctx.fillStyle = opacity < 1.0 ? 'rgba(255,255,255,0.4)' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'Bold 20px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      const labelText = `${node.name} ${node.birth_order ? `(${node.birth_order})` : ''}`;
      ctx.fillText(labelText, 128, 40);
    }
    const textTexture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: textTexture,
      transparent: opacity < 1.0,
      opacity: opacity,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, -(sphereRadius + 5), 0);
    sprite.scale.set(20, 5, 1);
    sprite.renderOrder = 10;
    group.add(sprite);

    return group;
  }, [mainHighlightId, relativeIdsSet]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return persons;
    return persons.filter(p => `${p.name} ${p.birth_order || ''} ${p.id}`.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [persons, searchTerm]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '650px', background: '#050b14', borderRadius: '15px', overflow: 'hidden' }}>
      
      {/* THANH TÌM KIẾM NỔI 3D (ĐÃ CHUYỂN LÊN GÓC TRÊN BÊN PHẢI) */}
      <div ref={searchContainerRef} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, width: '280px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Tìm & Làm nổi bật 3D..."
            value={searchTerm}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            style={{
              width: '100%',
              padding: '8px 30px 8px 12px',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            }}
          />
          {(selectedSearchId !== null || searchTerm) && (
            <button
              onClick={() => {
                setSelectedSearchId(null);
                setSearchTerm('');
                setIsOpen(false);
                resetSpreadNodes();
              }}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* DANH SÁCH GỢI Ý MỞ XUỐNG PHÍA DƯỚI */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            bottom: 'auto',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            marginTop: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            zIndex: 20
          }}>
            <div
              onClick={() => {
                setSelectedSearchId(null);
                setSearchTerm('');
                setIsOpen(false);
                resetSpreadNodes();
              }}
              style={{ padding: '8px 12px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer', fontStyle: 'italic', borderBottom: '1px solid #1e293b' }}
            >
              -- Hiện toàn bộ gia phả --
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => {
                    const pId = Number(p.id);
                    setSearchTerm(`${p.name}${p.birth_order ? ` (${p.birth_order})` : ''}`);
                    setIsOpen(false);

                    const relSet = new Set<number>();
                    const targetFid = p.fid ? Number(p.fid) : null;
                    const targetMid = p.mid ? Number(p.mid) : null;

                    if (targetFid) relSet.add(targetFid);
                    if (targetMid) relSet.add(targetMid);
                    if (Array.isArray(p.pids)) p.pids.forEach((sId: any) => relSet.add(Number(sId)));

                    persons.forEach(child => {
                      const cId = Number(child.id);
                      if (cId === pId) return;
                      const cFid = child.fid ? Number(child.fid) : null;
                      const cMid = child.mid ? Number(child.mid) : null;

                      if (cFid === pId || cMid === pId) relSet.add(cId);
                      if (targetFid && targetMid && cFid === targetFid && cMid === targetMid) relSet.add(cId);
                    });

                    handleSelectNode(pId, relSet);
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    borderBottom: '1px solid #1e293b',
                    color: '#f8fafc',
                    backgroundColor: selectedSearchId === Number(p.id) ? '#1e293b' : 'transparent'
                  }}
                >
                  <strong>{p.name}</strong> {p.birth_order && <span style={{ color: '#a78bfa' }}>({p.birth_order})</span>}
                </div>
              ))
            ) : (
              <div style={{ padding: '10px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        )}
      </div>

      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeThreeObject={createNodeObject}
        linkWidth={(link: any) => {
          if (!mainHighlightId) return 2;
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          return (sId === mainHighlightId || tId === mainHighlightId) ? 4 : 1;
        }}
        linkColor={(link: any) => {
          if (!mainHighlightId) return link.color || '#ffffff';
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          const isMainLink = sId === mainHighlightId || tId === mainHighlightId;
          const isRelativeLink = relativeIdsSet.has(sId) && relativeIdsSet.has(tId);
          if (isMainLink) return '#f59e0b';
          if (isRelativeLink) return link.color || '#10b981';
          return 'rgba(255, 255, 255, 0.08)';
        }}
        linkDirectionalParticles={(link: any) => {
          if (!mainHighlightId) return 2;
          const sId = typeof link.source === 'object' ? link.source.id : link.source;
          const tId = typeof link.target === 'object' ? link.target.id : link.target;
          return (sId === mainHighlightId || tId === mainHighlightId) ? 5 : 0;
        }}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={3}
        dagMode="td"
        dagLevelDistance={50}
        backgroundColor="#050b14"
        onNodeClick={(node: any) => {
          const pId = Number(node.id);
          setSearchTerm(`${node.name}${node.birth_order ? ` (${node.birth_order})` : ''}`);
          handleSelectNode(pId, relativeIdsSet);
        }}
      />
    </div>
  );
}