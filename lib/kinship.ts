export function calculateKinship(focusId: number | string | null, persons: any[]) {
  if (!focusId) return persons;

  const targetId = Number(focusId);

  // 1. CHUẨN HÓA KIỂU DỮ LIỆU: Ép tất cả ID về dạng Number để tránh lỗi so sánh '1' === 1
  const normalizedPersons = persons.map(p => ({
    ...p,
    id: Number(p.id),
    fid: p.fid !== null && p.fid !== undefined && p.fid !== '' ? Number(p.fid) : null,
    mid: p.mid !== null && p.mid !== undefined && p.mid !== '' ? Number(p.mid) : null,
    pids: Array.isArray(p.pids) ? p.pids.map((id: any) => Number(id)) : [],
    kinship_title: ''
  }));

  const map = new Map<number, any>();
  normalizedPersons.forEach(p => map.set(p.id, p));

  const focus = map.get(targetId);
  if (!focus) return persons;

  // 2. Bản thân
  focus.kinship_title = 'Bản thân';

  // Helper lấy danh sách phối ngẫu
  const getSpouses = (p: any) => {
    return (p.pids || []).map((id: number) => map.get(id)).filter(Boolean);
  };

  // 3. Vợ / Chồng
  getSpouses(focus).forEach((spouse: any) => {
    spouse.kinship_title = spouse.gender === 'female' ? 'Vợ' : 'Chồng';
  });

  // 4. Cha / Mẹ
  const father = focus.fid ? map.get(focus.fid) : null;
  const mother = focus.mid ? map.get(focus.mid) : null;

  if (father) father.kinship_title = 'Cha / Bố';
  if (mother) mother.kinship_title = 'Mẹ';

  // 5. Ông / Bà (Nội - Ngoại)
  const paternalGrandFather = father && father.fid ? map.get(father.fid) : null;
  const paternalGrandMother = father && father.mid ? map.get(father.mid) : null;
  const maternalGrandFather = mother && mother.fid ? map.get(mother.fid) : null;
  const maternalGrandMother = mother && mother.mid ? map.get(mother.mid) : null;

  if (paternalGrandFather) paternalGrandFather.kinship_title = 'Ông nội';
  if (paternalGrandMother) paternalGrandMother.kinship_title = 'Bà nội';
  if (maternalGrandFather) maternalGrandFather.kinship_title = 'Ông ngoại';
  if (maternalGrandMother) maternalGrandMother.kinship_title = 'Bà ngoại';

  // 6. Cụ / Cố (Cha Mẹ của Ông Nội / Bà Nội)
  const grandParents = [paternalGrandFather, paternalGrandMother, maternalGrandFather, maternalGrandMother].filter(Boolean);
  grandParents.forEach(gp => {
    if (gp.fid && map.has(gp.fid)) {
      map.get(gp.fid).kinship_title = gp.id === paternalGrandFather?.id || gp.id === paternalGrandMother?.id 
        ? 'Cụ nội (Ông Cố)' 
        : 'Cụ ngoại (Ông Cố)';
    }
    if (gp.mid && map.has(gp.mid)) {
      map.get(gp.mid).kinship_title = gp.id === paternalGrandFather?.id || gp.id === paternalGrandMother?.id 
        ? 'Cụ nội (Bà Cố)' 
        : 'Cụ ngoại (Bà Cố)';
    }
  });

  // 7. Anh / Chị / Em ruột
  normalizedPersons.forEach(p => {
    if (p.id !== targetId && ((father && p.fid === father.id) || (mother && p.mid === mother.id))) {
      if (!p.kinship_title) {
        p.kinship_title = p.gender === 'female' ? 'Chị / Em gái' : 'Anh / Em trai';
      }
    }
  });

  // 8. Chú / Bác / Cô (Anh em bên Nội)
  if (father && (father.fid || father.mid)) {
    normalizedPersons.forEach(p => {
      const isFatherSibling = p.id !== father.id && 
        ((father.fid && p.fid === father.fid) || (father.mid && p.mid === father.mid));

      if (isFatherSibling) {
        if (!p.kinship_title) {
          p.kinship_title = p.gender === 'female' ? 'Cô / Bác gái' : 'Chú / Bác';
        }

        // Vợ/Chồng của Chú/Bác/Cô (Thím, Dượng...)
        getSpouses(p).forEach((sp: any) => {
          if (!sp.kinship_title) {
            sp.kinship_title = p.gender === 'male' ? 'Thím / Bác gái' : 'Dượng';
          }
        });
      }
    });
  }

  // 9. Cậu / Dì (Anh em bên Ngoại)
  if (mother && (mother.fid || mother.mid)) {
    normalizedPersons.forEach(p => {
      const isMotherSibling = p.id !== mother.id && 
        ((mother.fid && p.fid === mother.fid) || (mother.mid && p.mid === mother.mid));

      if (isMotherSibling) {
        if (!p.kinship_title) {
          p.kinship_title = p.gender === 'female' ? 'Dì' : 'Cậu';
        }

        getSpouses(p).forEach((sp: any) => {
          if (!sp.kinship_title) {
            sp.kinship_title = p.gender === 'male' ? 'Mợ' : 'Dượng';
          }
        });
      }
    });
  }

  // 10. Anh / Chị / Em họ (Con của Chú/Bác/Cô/Cậu/Dì)
  normalizedPersons.forEach(p => {
    if (!p.kinship_title && (p.fid || p.mid)) {
      const pFather = p.fid ? map.get(p.fid) : null;
      const pMother = p.mid ? map.get(p.mid) : null;
      const parentTitle = pFather?.kinship_title || pMother?.kinship_title || '';

      const validParentTitles = ['Chú / Bác', 'Cô / Bác gái', 'Cậu', 'Dì', 'Thím / Bác gái', 'Mợ', 'Dượng'];
      if (validParentTitles.some(t => parentTitle.includes(t))) {
        p.kinship_title = p.gender === 'female' ? 'Chị / Em họ' : 'Anh / Em họ';
      }
    }
  });

  // 11. Con đẻ
  normalizedPersons.forEach(p => {
    if (p.fid === targetId || p.mid === targetId) {
      p.kinship_title = p.gender === 'female' ? 'Con gái' : 'Con trai';
    }
  });

  // 12. Cháu
  normalizedPersons.forEach(p => {
    if (!p.kinship_title && (p.fid || p.mid)) {
      const pFather = p.fid ? map.get(p.fid) : null;
      const pMother = p.mid ? map.get(p.mid) : null;
      if ((pFather && (pFather.fid === targetId || pFather.mid === targetId)) || 
          (pMother && (pMother.fid === targetId || pMother.mid === targetId))) {
        p.kinship_title = 'Cháu';
      }
    }
  });

  return Array.from(map.values());
}