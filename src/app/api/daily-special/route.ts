import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat

    const special = await db.dailySpecial.findFirst({
      where: {
        dayOfWeek: today,
        active: true,
      },
      orderBy: { order: 'asc' },
    });

    if (!special) {
      return NextResponse.json({ active: false });
    }

    // Compute the display price
    let displayPrice = special.originalPrice;
    let discountLabel = '';

    if (special.discountType === 'percentage' && special.discountPercent && special.discountPercent > 0) {
      const reduction = Math.round(special.originalPrice * special.discountPercent / 100);
      displayPrice = special.originalPrice - reduction;
      discountLabel = `-${special.discountPercent}%`;
    } else if (special.discountType === 'fixed_price' && special.specialPrice && special.specialPrice < special.originalPrice) {
      const percentDiff = Math.round(((special.originalPrice - special.specialPrice) / special.originalPrice) * 100);
      displayPrice = special.specialPrice;
      discountLabel = `-${percentDiff}%`;
    }

    return NextResponse.json({
      active: true,
      ...special,
      displayPrice,
      discountLabel,
    });
  } catch (error) {
    return NextResponse.json({ active: false }, { status: 500 });
  }
}
