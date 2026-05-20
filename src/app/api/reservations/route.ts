import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-admin-pin');
  if (authHeader !== ADMIN_PIN) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const reservations = await db.reservation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, date, time, guests, message } = body;

    if (!name || !phone || !date || !time || !guests) {
      return NextResponse.json(
        { error: 'Nom, téléphone, date, heure et nombre de personnes sont requis.' },
        { status: 400 }
      );
    }

    const reservation = await db.reservation.create({
      data: {
        name: String(name).slice(0, 100),
        phone: String(phone).slice(0, 20),
        date: String(date),
        time: String(time),
        guests: Number(guests),
        message: message ? String(message).slice(0, 500) : null,
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Échec de la réservation' }, { status: 500 });
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

    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
    }

    const reservation = await db.reservation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    return NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 });
  }
}
