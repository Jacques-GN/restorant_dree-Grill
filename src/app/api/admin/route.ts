import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// Simple auth check via header
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-pin');
  return authHeader === ADMIN_PIN;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const categories = await db.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const dailySpecials = await db.dailySpecial.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { order: 'asc' }],
    });

    const totalItems = await db.menuItem.count();
    const totalReservations = await db.reservation.count();
    const pendingReservations = await db.reservation.count({ where: { status: 'pending' } });
    const totalInquiries = await db.contactInquiry.count();
    const newInquiries = await db.contactInquiry.count({ where: { status: 'new' } });

    return NextResponse.json({
      categories,
      dailySpecials,
      stats: {
        totalItems,
        totalReservations,
        pendingReservations,
        totalInquiries,
        newInquiries,
        activeSpecials: dailySpecials.filter(s => s.active).length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'createCategory': {
        const category = await db.category.create({
          data: {
            name: data.name,
            slug: data.slug,
            order: data.order || 0,
          },
        });
        return NextResponse.json(category, { status: 201 });
      }

      case 'updateCategory': {
        const category = await db.category.update({
          where: { id: data.id },
          data: { name: data.name, slug: data.slug, order: data.order },
        });
        return NextResponse.json(category);
      }

      case 'deleteCategory': {
        await db.category.delete({ where: { id: data.id } });
        return NextResponse.json({ success: true });
      }

      case 'createItem': {
        const item = await db.menuItem.create({
          data: {
            name: data.name,
            description: data.description || null,
            price: Number(data.price),
            categoryId: data.categoryId,
            featured: data.featured || false,
            available: data.available !== false,
            order: data.order || 0,
          },
        });
        return NextResponse.json(item, { status: 201 });
      }

      case 'updateItem': {
        const item = await db.menuItem.update({
          where: { id: data.id },
          data: {
            name: data.name,
            description: data.description || null,
            price: Number(data.price),
            categoryId: data.categoryId,
            featured: data.featured,
            available: data.available,
            order: data.order,
          },
        });
        return NextResponse.json(item);
      }

      case 'deleteItem': {
        await db.menuItem.delete({ where: { id: data.id } });
        return NextResponse.json({ success: true });
      }

      case 'createDailySpecial': {
        const special = await db.dailySpecial.create({
          data: {
            name: data.name,
            description: data.description || null,
            image: data.image || null,
            dayOfWeek: Number(data.dayOfWeek),
            originalPrice: Number(data.originalPrice),
            discountType: data.discountType || 'percentage',
            specialPrice: data.discountType === 'fixed_price' ? Number(data.specialPrice) : null,
            discountPercent: data.discountType === 'percentage' ? Number(data.discountPercent) : null,
            active: data.active !== false,
            order: data.order || 0,
          },
        });
        return NextResponse.json(special, { status: 201 });
      }

      case 'updateDailySpecial': {
        const special = await db.dailySpecial.update({
          where: { id: data.id },
          data: {
            name: data.name,
            description: data.description || null,
            image: data.image || null,
            dayOfWeek: Number(data.dayOfWeek),
            originalPrice: Number(data.originalPrice),
            discountType: data.discountType || 'percentage',
            specialPrice: data.discountType === 'fixed_price' ? Number(data.specialPrice) : null,
            discountPercent: data.discountType === 'percentage' ? Number(data.discountPercent) : null,
            active: data.active,
            order: data.order || 0,
          },
        });
        return NextResponse.json(special);
      }

      case 'deleteDailySpecial': {
        await db.dailySpecial.delete({ where: { id: data.id } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Échec de l'opération" }, { status: 500 });
  }
}
