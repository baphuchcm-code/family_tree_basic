import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Hoặc thư viện kết nối SQL của bạn

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { personId, fid, mid, selectedChildrenIds } = await req.json();

    // 1. Cập nhật Cha (fid) và Mẹ (mid) cho thành viên hiện tại
    const { error: updateParentErr } = await supabase
      .from('persons')
      .update({
        fid: fid ? Number(fid) : null,
        mid: mid ? Number(mid) : null
      })
      .eq('id', personId);

    if (updateParentErr) throw updateParentErr;

    // 2. Lấy thông tin giới tính người này để gán làm Cha hay Mẹ cho danh sách Con
    const { data: currentPerson } = await supabase
      .from('persons')
      .select('gender')
      .eq('id', personId)
      .single();

    if (selectedChildrenIds && Array.isArray(selectedChildrenIds)) {
      const updatePayload = currentPerson?.gender === 'female' 
        ? { mid: Number(personId) } 
        : { fid: Number(personId) };

      // Cập nhật mối quan hệ cho các con đã chọn
      if (selectedChildrenIds.length > 0) {
        await supabase
          .from('persons')
          .update(updatePayload)
          .in('id', selectedChildrenIds.map(Number));
      }
    }

    return NextResponse.json({ success: true, message: 'Cập nhật mối quan hệ SQL thành công!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}