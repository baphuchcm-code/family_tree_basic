export interface PersonNode {
  id: number;
  name: string;
  gender: string;
  fid?: number | null;
  mid?: number | null;
  pids?: number[] | null;
  [key: string]: any;
}

export function calculateKinship(focusId: number, nodes: PersonNode[]): PersonNode[] {
  const nodeMap = new Map<number, PersonNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const focusNode = nodeMap.get(focusId);
  if (!focusNode) return nodes;

  const isFocusMale = focusNode.gender === 'male';

  // 1. Tìm Vợ / Chồng của Focus
  const spouseIds = new Set<number>();
  if (Array.isArray(focusNode.pids)) {
    focusNode.pids.forEach(id => spouseIds.add(id));
  }
  // Tìm thêm qua con chung
  nodes.forEach(n => {
    if (n.fid === focusId && n.mid) spouseIds.add(n.mid);
    if (n.mid === focusId && n.fid) spouseIds.add(n.fid);
  });

  const mainSpouseId = Array.from(spouseIds)[0] || null;
  const mainSpouseNode = mainSpouseId ? nodeMap.get(mainSpouseId) : null;

  return nodes.map(node => {
    // A. BẢN THÂN
    if (node.id === focusId) {
      return { ...node, kinship_title: 'Bản thân' };
    }

    // B. VỢ / CHỒNG
    if (spouseIds.has(node.id)) {
      return { ...node, kinship_title: isFocusMale ? 'Vợ' : 'Chồng' };
    }

    // C. CON ĐẺ (Cha = Focus hoặc Mẹ = Focus)
    if (node.fid === focusId || node.mid === focusId) {
      return {
        ...node,
        kinship_title: node.gender === 'male' ? 'Con trai' : 'Con gái'
      };
    }

    // D. CHA / MẸ ĐẺ
    if (node.id === focusNode.fid) return { ...node, kinship_title: 'Cha / Bố' };
    if (node.id === focusNode.mid) return { ...node, kinship_title: 'Mẹ' };

    // E. BỐ MẸ CỦA VỢ / CHỒNG (Bố chồng, Mẹ chồng, Bố vợ, Mẹ vợ)
    if (mainSpouseNode) {
      if (node.id === mainSpouseNode.fid) {
        return { ...node, kinship_title: isFocusMale ? 'Bố vợ' : 'Bố chồng' };
      }
      if (node.id === mainSpouseNode.mid) {
        return { ...node, kinship_title: isFocusMale ? 'Mẹ vợ' : 'Mẹ chồng' };
      }
    }

    // F. ANH / CHỊ / EM CỦA VỢ HOẶC CHỒNG
    if (mainSpouseNode && (mainSpouseNode.fid || mainSpouseNode.mid)) {
      const isSpouseSibling = 
        (mainSpouseNode.fid && node.fid === mainSpouseNode.fid) ||
        (mainSpouseNode.mid && node.mid === mainSpouseNode.mid);

      if (isSpouseSibling && node.id !== mainSpouseNode.id) {
        const isMale = node.gender === 'male';
        const isOlder = node.id < mainSpouseNode.id;

        if (!isFocusMale) {
          // Focus là Vợ -> Nhìn về nhà Chồng
          if (isMale) return { ...node, kinship_title: isOlder ? 'Anh chồng' : 'Em chồng (Chú)' };
          return { ...node, kinship_title: isOlder ? 'Chị chồng' : 'Em chồng (Cô)' };
        } else {
          // Focus là Chồng -> Nhìn về nhà Vợ
          if (isMale) return { ...node, kinship_title: isOlder ? 'Anh vợ' : 'Em vợ (Cậu)' };
          return { ...node, kinship_title: isOlder ? 'Chị vợ' : 'Em vợ (Dì)' };
        }
      }
    }

    // G. ANH / CHỊ / EM ĐẺ (Cùng Bố/Mẹ với Focus)
    const isDirectSibling = 
      (focusNode.fid && node.fid === focusNode.fid) ||
      (focusNode.mid && node.mid === focusNode.mid);

    if (isDirectSibling) {
      const isOlder = node.id < focusId;
      if (node.gender === 'male') return { ...node, kinship_title: isOlder ? 'Anh trai' : 'Em trai' };
      return { ...node, kinship_title: isOlder ? 'Chị gái' : 'Em gái' };
    }

    // H. CHÁU RUỘT (Con của Anh/Chị/Em)
    if (node.fid || node.mid) {
      const father = node.fid ? nodeMap.get(node.fid) : null;
      const mother = node.mid ? nodeMap.get(node.mid) : null;
      const parentIsFocusSibling = 
        (father && ((focusNode.fid && father.fid === focusNode.fid) || (focusNode.mid && father.mid === focusNode.mid))) ||
        (mother && ((focusNode.fid && mother.fid === focusNode.fid) || (focusNode.mid && mother.mid === focusNode.mid)));

      if (parentIsFocusSibling) {
        return { ...node, kinship_title: 'Cháu' };
      }
    }

    // I. OÔNG BÀ NỘI / NGOẠI
    if (focusNode.fid) {
      const pFather = nodeMap.get(focusNode.fid);
      if (pFather && (node.id === pFather.fid || node.id === pFather.mid)) {
        return { ...node, kinship_title: node.gender === 'male' ? 'Ông nội' : 'Bà nội' };
      }
    }
    if (focusNode.mid) {
      const pMother = nodeMap.get(focusNode.mid);
      if (pMother && (node.id === pMother.fid || node.id === pMother.mid)) {
        return { ...node, kinship_title: node.gender === 'male' ? 'Ông ngoại' : 'Bà ngoại' };
      }
    }

    // J. DÒNG HỌ / MẶC ĐỊNH
    return { ...node, kinship_title: node.occupation || 'Họ hàng' };
  });
}