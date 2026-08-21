export function calculateKinship(focusId: number, persons: any[]) {
  // Tạo Map để tra cứu nhanh
  const map = new Map<number, any>();
  persons.forEach(p => {
    map.set(p.id, { ...p, kinship_title: '' });
  });

  const focus = map.get(focusId);
  if (!focus) return persons;

  // 1. Bản thân
  focus.kinship_title = 'Bản thân';

  // 2. Vợ / Chồng
  const pids = Array.isArray(focus.pids) ? focus.pids : [];
  pids.forEach((spouseId: number) => {
    const spouse = map.get(spouseId);
    if (spouse) {
      spouse.kinship_title = spouse.gender === 'female' ? 'Vợ' : 'Chồng';
    }
  });

  // 3. Cha / Mẹ
  const father = focus.fid ? map.get(focus.fid) : null;
  const mother = focus.mid ? map.get(focus.mid) : null;

  if (father) father.kinship_title = 'Cha / Bố';
  if (mother) mother.kinship_title = 'Mẹ';

  // 4. Ông / Bà (Nội - Ngoại)
  if (father) {
    if (father.fid && map.has(father.fid)) map.get(father.fid).kinship_title = 'Ông nội';
    if (father.mid && map.has(father.mid)) map.get(father.mid).kinship_title = 'Bà nội';
  }
  if (mother) {
    if (mother.fid && map.has(mother.fid)) map.get(mother.fid).kinship_title = 'Ông ngoại';
    if (mother.mid && map.has(mother.mid)) map.get(mother.mid).kinship_title = 'Bà ngoại';
  }

  // 5. Cụ / Cố (Ông/Bà của Cha hoặc Mẹ)
  persons.forEach(p => {
    if (father && father.fid) {
      const grandFather = map.get(father.fid);
      if (grandFather) {
        if (grandFather.fid === p.id) p.kinship_title = 'Cụ nội (Ông Cố)';
        if (grandFather.mid === p.id) p.kinship_title = 'Cụ nội (Bà Cố)';
      }
    }
  });

  // 6. Anh / Chị / Em ruột
  persons.forEach(p => {
    if (p.id !== focusId && ((father && p.fid === father.id) || (mother && p.mid === mother.id))) {
      if (!p.kinship_title) {
        p.kinship_title = p.gender === 'female' ? 'Chị / Em gái' : 'Anh / Em trai';
      }
    }
  });

  // 7. Bác / Chú / Cô / Cậu / Dì & Thím / Mợ / Dượng
  if (father) {
    persons.forEach(p => {
      // Anh/Chị/Em của Cha
      if (p.id !== father.id && (p.fid === father.fid || p.mid === father.mid) && p.fid) {
        if (!p.kinship_title) {
          p.kinship_title = p.gender === 'female' ? 'Cô / Bác gái' : 'Chú / Bác';
        }
        // Vợ của Chú/Bác (Thím / Bác gái)
        const unclePids = Array.isArray(p.pids) ? p.pids : [];
        unclePids.forEach((wifeId: number) => {
          const wife = map.get(wifeId);
          if (wife && !wife.kinship_title) {
            wife.kinship_title = p.gender === 'male' ? 'Thím / Bác gái' : 'Dượng';
          }
        });
      }
    });
  }

  // 8. Anh / Chị / Em họ (Con của Chú/Bác/Cô/Cậu/Dì)
  persons.forEach(p => {
    if (p.fid || p.mid) {
      const parentOfP = map.get(p.fid) || map.get(p.mid);
      if (parentOfP && (parentOfP.kinship_title?.includes('Chú') || parentOfP.kinship_title?.includes('Cô') || parentOfP.kinship_title?.includes('Bác'))) {
        if (!p.kinship_title) {
          p.kinship_title = 'Anh / Em họ';
        }
      }
    }
  });

  // 9. Con đẻ
  persons.forEach(p => {
    if (p.fid === focusId || p.mid === focusId) {
      p.kinship_title = p.gender === 'female' ? 'Con gái' : 'Con trai';
    }
  });

  // 10. Cháu (Nội / Ngoại)
  persons.forEach(p => {
    if (p.fid || p.mid) {
      const parent = map.get(p.fid) || map.get(p.mid);
      if (parent && (parent.fid === focusId || parent.mid === focusId)) {
        p.kinship_title = 'Cháu';
      }
    }
  });

  return Array.from(map.values());
}