export function calculateKinship(focusId: number | string | null, persons: any[]) {
  if (focusId === null || focusId === undefined || focusId === '') return persons;

  const toNum = (val: any): number | null => 
    val !== null && val !== undefined && val !== '' ? Number(val) : null;
  
  const targetId = toNum(focusId);
  if (targetId === null) return persons;

  // 1. Chuẩn hóa tất cả ID về kiểu Number (Đã khai báo kiểu rõ ràng cho id)
  const normalizedPersons = persons.map(p => ({
    ...p,
    id: Number(p.id),
    fid: toNum(p.fid),
    mid: toNum(p.mid),
    pids: Array.isArray(p.pids) 
      ? p.pids.map((id: any) => toNum(id)).filter((id: number | null): id is number => id !== null) 
      : [],
    kinship_title: ''
  }));

  const map = new Map<number, any>();
  normalizedPersons.forEach(p => map.set(p.id, p));

  const focus = map.get(targetId);
  if (!focus) return persons;

  // Helper lấy danh sách Vợ / Chồng
  const getSpouses = (p: any) => (p.pids || []).map((id: number) => map.get(id)).filter(Boolean);

  // Helper so sánh độ tuổi/năm sinh
  const isOlder = (p1: any, p2: any) => {
    if (p1.birth_year && p2.birth_year) return p1.birth_year < p2.birth_year;
    return p1.id < p2.id;
  };

  // -------------------------------------------------------------
  // 1. BẢN THÂN, VỢ / CHỒNG & HỌ HÀNG BÊN VỢ / CHỒNG
  // -------------------------------------------------------------
  focus.kinship_title = 'Bản thân';

  getSpouses(focus).forEach((spouse: any) => {
    spouse.kinship_title = spouse.gender === 'female' ? 'Vợ' : 'Chồng';

    // Bố / Mẹ Vợ (Chồng)
    const spouseFather = spouse.fid ? map.get(spouse.fid) : null;
    const spouseMother = spouse.mid ? map.get(spouse.mid) : null;

    if (spouseFather) spouseFather.kinship_title = focus.gender === 'female' ? 'Bố chồng' : 'Bố vợ';
    if (spouseMother) spouseMother.kinship_title = focus.gender === 'female' ? 'Mẹ chồng' : 'Mẹ vợ';

    // Anh / Chị / Em Vợ (Chồng)
    normalizedPersons.forEach(p => {
      if (p.id !== spouse.id && ((spouseFather && p.fid === spouseFather.id) || (spouseMother && p.mid === spouseMother.id))) {
        const older = isOlder(p, spouse);
        const isWife = focus.gender === 'male';
        if (p.gender === 'female') {
          p.kinship_title = older ? (isWife ? 'Chị vợ' : 'Chị chồng') : (isWife ? 'Em vợ' : 'Em chồng');
        } else {
          p.kinship_title = older ? (isWife ? 'Anh vợ' : 'Anh chồng') : (isWife ? 'Em vợ' : 'Em chồng');
        }
      }
    });
  });

  // -------------------------------------------------------------
  // 2. CHA / MẸ
  // -------------------------------------------------------------
  const father = focus.fid ? map.get(focus.fid) : null;
  const mother = focus.mid ? map.get(focus.mid) : null;

  if (father) father.kinship_title = 'Cha / Bố';
  if (mother) mother.kinship_title = 'Mẹ';

  // -------------------------------------------------------------
  // 3. ÔNG / BÀ & CỤ (Nội & Ngoại)
  // -------------------------------------------------------------
  const paternalGF = father && father.fid ? map.get(father.fid) : null;
  const paternalGM = father && father.mid ? map.get(father.mid) : null;
  const maternalGF = mother && mother.fid ? map.get(mother.fid) : null;
  const maternalGM = mother && mother.mid ? map.get(mother.mid) : null;

  if (paternalGF) paternalGF.kinship_title = 'Ông nội';
  if (paternalGM) paternalGM.kinship_title = 'Bà nội';
  if (maternalGF) maternalGF.kinship_title = 'Ông ngoại';
  if (maternalGM) maternalGM.kinship_title = 'Bà ngoại';

  // Cụ Nội / Cụ Ngoại
  [paternalGF, paternalGM].filter(Boolean).forEach(gp => {
    if (gp.fid && map.has(gp.fid)) map.get(gp.fid).kinship_title = 'Cụ nội (Ông Cố)';
    if (gp.mid && map.has(gp.mid)) map.get(gp.mid).kinship_title = 'Cụ nội (Bà Cố)';
  });
  [maternalGF, maternalGM].filter(Boolean).forEach(gp => {
    if (gp.fid && map.has(gp.fid)) map.get(gp.fid).kinship_title = 'Cụ ngoại (Ông Cố)';
    if (gp.mid && map.has(gp.mid)) map.get(gp.mid).kinship_title = 'Cụ ngoại (Bà Cố)';
  });

  // -------------------------------------------------------------
  // 4. ANH / CHỊ / EM RUỘT & DÂU / RỂ
  // -------------------------------------------------------------
  normalizedPersons.forEach(p => {
    const isSibling = p.id !== targetId && ((father && p.fid === father.id) || (mother && p.mid === mother.id));

    if (isSibling) {
      const older = isOlder(p, focus);
      if (p.gender === 'female') {
        p.kinship_title = older ? 'Chị gái' : 'Em gái';
      } else {
        p.kinship_title = older ? 'Anh trai' : 'Em trai';
      }

      getSpouses(p).forEach((sp: any) => {
        if (p.gender === 'male') {
          sp.kinship_title = older ? 'Chị dâu' : 'Em dâu';
        } else {
          sp.kinship_title = older ? 'Anh rể' : 'Em rể';
        }
      });
    }
  });

  // -------------------------------------------------------------
  // 5. CHÚ / BÁC / CÔ / CẬU / DÌ & THÍM / MỢ / DƯỢNG
  // -------------------------------------------------------------
  // Bên Nội (Anh em của Bố)
  if (father && (father.fid || father.mid)) {
    normalizedPersons.forEach(p => {
      const isFatherSibling = p.id !== father.id && ((father.fid && p.fid === father.fid) || (father.mid && p.mid === father.mid));
      if (isFatherSibling) {
        const olderThanFather = isOlder(p, father);
        if (p.gender === 'female') {
          p.kinship_title = olderThanFather ? 'Bác gái' : 'Cô';
        } else {
          p.kinship_title = olderThanFather ? 'Bác' : 'Chú';
        }

        getSpouses(p).forEach((sp: any) => {
          if (p.gender === 'male') {
            sp.kinship_title = olderThanFather ? 'Bác gái' : 'Thím';
          } else {
            sp.kinship_title = 'Dượng';
          }
        });
      }
    });
  }

  // Bên Ngoại (Anh em của Mẹ)
  if (mother && (mother.fid || mother.mid)) {
    normalizedPersons.forEach(p => {
      const isMotherSibling = p.id !== mother.id && ((mother.fid && p.fid === mother.fid) || (mother.mid && p.mid === mother.mid));
      if (isMotherSibling) {
        const olderThanMother = isOlder(p, mother);
        if (p.gender === 'female') {
          p.kinship_title = olderThanMother ? 'Bác gái' : 'Dì';
        } else {
          p.kinship_title = olderThanMother ? 'Bác' : 'Cậu';
        }

        getSpouses(p).forEach((sp: any) => {
          if (p.gender === 'male') {
            sp.kinship_title = olderThanMother ? 'Bác gái' : 'Mợ';
          } else {
            sp.kinship_title = 'Dượng';
          }
        });
      }
    });
  }

  // -------------------------------------------------------------
  // 6. CON ĐẺ & CON DÂU / CON RỂ
  // -------------------------------------------------------------
  normalizedPersons.forEach(p => {
    if (p.fid === targetId || p.mid === targetId) {
      p.kinship_title = p.gender === 'female' ? 'Con gái' : 'Con trai';

      getSpouses(p).forEach((sp: any) => {
        sp.kinship_title = p.gender === 'female' ? 'Con rể' : 'Con dâu';
      });
    }
  });

  // -------------------------------------------------------------
  // 7. CHÁU NỘI / NGOẠI / RUỘT / CỐ / ANH EM HỌ & DÂU / RỂ
  // -------------------------------------------------------------
  normalizedPersons.forEach(p => {
    if (!p.kinship_title && (p.fid || p.mid)) {
      const pFather = p.fid ? map.get(p.fid) : null;
      const pMother = p.mid ? map.get(p.mid) : null;
      
      const parent = [pFather, pMother].find(parentObj => parentObj && parentObj.kinship_title);

      if (parent) {
        if (parent.kinship_title === 'Con trai') {
          p.kinship_title = 'Cháu nội';
        } else if (parent.kinship_title === 'Con gái') {
          p.kinship_title = 'Cháu ngoại';
        } 
        else if (['Cháu nội', 'Cháu ngoại'].includes(parent.kinship_title)) {
          p.kinship_title = 'Cháu cố';
        }
        else if (['Anh trai', 'Em trai', 'Chị gái', 'Em gái'].includes(parent.kinship_title)) {
          p.kinship_title = 'Cháu';
        }
        else if (['Chú', 'Bác', 'Cô', 'Cậu', 'Dì', 'Thím', 'Mợ', 'Dượng', 'Bác gái'].includes(parent.kinship_title)) {
          if (['Bác', 'Bác gái'].includes(parent.kinship_title)) {
            p.kinship_title = p.gender === 'female' ? 'Chị họ' : 'Anh họ';
          } else {
            p.kinship_title = 'Em họ';
          }
        }

        if (['Cháu nội', 'Cháu ngoại', 'Cháu'].includes(p.kinship_title)) {
          getSpouses(p).forEach((sp: any) => {
            sp.kinship_title = p.gender === 'female' ? 'Cháu rể' : 'Cháu dâu';
          });
        }
      }
    }
  });

  return Array.from(map.values());
}