import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-admin-pin');
  if (authHeader !== ADMIN_PIN) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const inquiries = await db.contactInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(inquiries);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, message, phone, subject } = body;

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Nom et message sont requis.' },
        { status: 400 }
      );
    }

    const inquiry = await db.contactInquiry.create({
      data: {
        name: String(name).slice(0, 100),
        phone: phone ? String(phone).slice(0, 20) : null,
        subject: subject ? String(subject).slice(0, 200) : null,
        message: String(message).slice(0, 1000),
      },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Échec de l'envoi du message" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('x-admin-pin');
  if (authHeader !== ADMIN_PIN) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID et statut sont requis.' }, { status: 400 });
    }

    const inquiry = await db.contactInquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(inquiry);
  } catch (error) {
    return NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 });
  }
}
