import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-pin');
  if (authHeader !== ADMIN_PIN) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // Check if specials already exist
    const existing = await db.dailySpecial.count();
    if (existing > 0) {
      return NextResponse.json({ message: 'Plats du jour déjà initialisés', count: existing });
    }

    const specials = [
      { name: "Mix Deen's Grill", description: "Assiette généreuse de bœuf, mouton et ailerons de dinde grillés au charbon, accompagnée de frites et salade fraîche.", image: '/food-mixgrill-real.jpeg', dayOfWeek: 0, originalPrice: 5000, discountType: 'percentage', discountPercent: 10, order: 0 },
      { name: "Shawarma Deen's", description: "Shawarma au bœuf mariné aux épices, servi avec crudités et sauce blanche maison.", image: '/food-mouton-real.jpeg', dayOfWeek: 1, originalPrice: 3000, discountType: 'percentage', discountPercent: 15, order: 0 },
      { name: 'Poulet aux légumes', description: "Poulet entier grillé au feu de bois, croustillant à l'extérieur et juteux à l'intérieur, avec légumes.", image: '/food-poulet-real.jpeg', dayOfWeek: 2, originalPrice: 4000, discountType: 'percentage', discountPercent: 15, order: 0 },
      { name: 'Pizza', description: "Pizza artisanale garnie de bœuf grillé, poivrons, oignons et fromage fondant.", image: '/food-pizza-real.jpeg', dayOfWeek: 3, originalPrice: 4000, discountType: 'percentage', discountPercent: 12, order: 0 },
      { name: 'Mouton fondant aux légumes', description: 'Mouton tendre grillé aux légumes, mariné aux épices traditionnelles burkinabè.', image: '/food-mechouis-real.jpeg', dayOfWeek: 4, originalPrice: 5000, discountType: 'percentage', discountPercent: 20, order: 0 },
      { name: 'Assiette de saucisse & merguez', description: 'Assiette de saucisses et merguez grillées, servies avec frites maison et sauce piquante.', image: '/food-saucisse-real.jpeg', dayOfWeek: 5, originalPrice: 3000, discountType: 'percentage', discountPercent: 10, order: 0 },
      { name: 'Mechouis (mouton entier)', description: "Mouton entier fondant grillé lentement au feu de bois, accompagné de riz parfumé et légumes.", image: '/food-mixgrill-real.jpeg', dayOfWeek: 6, originalPrice: 4000, discountType: 'percentage', discountPercent: 15, order: 0 },
    ];

    const created = [];
    for (const s of specials) {
      const item = await db.dailySpecial.create({ data: s });
      created.push(item);
    }

    return NextResponse.json({ message: 'Plats du jour initialisés avec succès', count: created.length });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Échec de l\'initialisation', detail: String(error) }, { status: 500 });
  }
}
