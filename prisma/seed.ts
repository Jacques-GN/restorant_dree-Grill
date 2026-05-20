import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'entrees' },
      update: {},
      create: { name: 'Nos Entrées', slug: 'entrees', order: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'soupes' },
      update: {},
      create: { name: 'Nos Soupes', slug: 'soupes', order: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'spaghettis' },
      update: {},
      create: { name: 'Nos Spaghettis', slug: 'spaghettis', order: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'fast-food' },
      update: {},
      create: { name: 'Fast Food', slug: 'fast-food', order: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'pizzas' },
      update: {},
      create: { name: 'Nos Pizzas', slug: 'pizzas', order: 5 },
    }),
    prisma.category.upsert({
      where: { slug: 'grillades' },
      update: {},
      create: { name: 'Nos Grillades', slug: 'grillades', order: 6 },
    }),
    prisma.category.upsert({
      where: { slug: 'accompagnements' },
      update: {},
      create: { name: 'Nos Accompagnements', slug: 'accompagnements', order: 7 },
    }),
    prisma.category.upsert({
      where: { slug: 'boissons' },
      update: {},
      create: { name: 'Nos Boissons', slug: 'boissons', order: 8 },
    }),
    prisma.category.upsert({
      where: { slug: 'cocktails' },
      update: {},
      create: { name: 'Nos Cocktails', slug: 'cocktails', order: 9 },
    }),
    prisma.category.upsert({
      where: { slug: 'cafes' },
      update: {},
      create: { name: 'Nos Cafés', slug: 'cafes', order: 10 },
    }),
    prisma.category.upsert({
      where: { slug: 'thes' },
      update: {},
      create: { name: 'Nos Thés', slug: 'thes', order: 11 },
    }),
  ]);

  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  // Menu items data
  const menuItems = [
    // Entrées
    { name: 'Salade verte', description: 'Feuilles de salade, concombre, oignon, tomate', price: 1500, categoryId: catMap.get('entrees')!, order: 1 },
    { name: 'Salade niçoise', description: 'Feuilles de salade, jambon, œuf, saucisse fumée', price: 3000, categoryId: catMap.get('entrees')!, order: 2 },
    { name: 'Salade composée', description: 'Feuilles de salade, œuf, carotte, maïs doux, concombre, petit pois, saucisson', price: 3500, categoryId: catMap.get('entrees')!, order: 3 },
    { name: 'Charcuterie', description: 'Petit pois, saucisson, maïs doux, macédoine, œuf', price: 3000, categoryId: catMap.get('entrees')!, order: 4 },

    // Soupes
    { name: 'Kedjenou de poulet', description: null, price: 6000, categoryId: catMap.get('soupes')!, order: 1 },
    { name: 'Kedjenou de poisson', description: null, price: 6000, categoryId: catMap.get('soupes')!, order: 2 },
    { name: 'Kedjenou de mouton', description: null, price: 5000, categoryId: catMap.get('soupes')!, order: 3 },

    // Spaghettis
    { name: 'Spaghetti au bœuf', description: null, price: 1500, categoryId: catMap.get('spaghettis')!, order: 1 },
    { name: 'Spaghetti aux légumes', description: null, price: 1500, categoryId: catMap.get('spaghettis')!, order: 2 },

    // Fast Food
    { name: 'Shawarma (Bœuf ou légumes)', description: null, price: 2000, categoryId: catMap.get('fast-food')!, order: 1, featured: true },
    { name: 'Shawarma Poulet', description: null, price: 2500, categoryId: catMap.get('fast-food')!, order: 2 },
    { name: 'Shawarma Mix Deen\'s', description: null, price: 3000, categoryId: catMap.get('fast-food')!, order: 3, featured: true },
    { name: 'Pain anglais', description: null, price: 1000, categoryId: catMap.get('fast-food')!, order: 4 },
    { name: 'Hamburger', description: null, price: 2000, categoryId: catMap.get('fast-food')!, order: 5 },
    { name: 'Cheese Burger', description: null, price: 2500, categoryId: catMap.get('fast-food')!, order: 6 },
    { name: 'Burger Deen\'s Grill', description: null, price: 3500, categoryId: catMap.get('fast-food')!, order: 7, featured: true },

    // Pizzas
    { name: 'Margherita', description: 'Sauce tomate, fromage', price: 4000, categoryId: catMap.get('pizzas')!, order: 1 },
    { name: 'Roi', description: 'Saucisson, sauce, fromage, champignon, olive noir', price: 5000, categoryId: catMap.get('pizzas')!, order: 2 },
    { name: 'Reine', description: 'Bœuf fondant, sauce, fromage, jambon, olive noir', price: 5000, categoryId: catMap.get('pizzas')!, order: 3 },
    { name: 'Deen\'s Grill', description: 'Mouton fondant, bœuf fondant, fromage, sauce, champignon, olive noir', price: 7000, categoryId: catMap.get('pizzas')!, order: 4, featured: true },
    { name: '4 Saisons', description: 'Mouton fondant, sauce, saucisson, fromage, champignon, olive noir', price: 5500, categoryId: catMap.get('pizzas')!, order: 5 },

    // Grillades
    { name: 'Bœuf fondant', description: 'À partir de', price: 2000, categoryId: catMap.get('grillades')!, order: 1, featured: true },
    { name: 'Petit pois au mouton', description: null, price: 5000, categoryId: catMap.get('grillades')!, order: 2 },
    { name: 'Mouton sauté à la pomme', description: null, price: 5000, categoryId: catMap.get('grillades')!, order: 3 },
    { name: 'Mouton fondant aux légumes', description: null, price: 5000, categoryId: catMap.get('grillades')!, order: 4 },
    { name: 'Mouton fond au couscous', description: null, price: 6000, categoryId: catMap.get('grillades')!, order: 5 },
    { name: 'Gigot d\'agneau aux légumes', description: null, price: 7000, categoryId: catMap.get('grillades')!, order: 6, featured: true },
    { name: 'Poulet pané', description: null, price: 6000, categoryId: catMap.get('grillades')!, order: 7 },
    { name: 'Poulet aux légumes', description: null, price: 5000, categoryId: catMap.get('grillades')!, order: 8 },
    { name: 'Poulet à l\'ail', description: null, price: 5000, categoryId: catMap.get('grillades')!, order: 9 },
    { name: 'Poulet flambé', description: null, price: 5000, categoryId: catMap.get('grillades')!, order: 10 },
    { name: 'Ailerons de dinde', description: null, price: 5000, categoryId: catMap.get('grillades')!, order: 11 },
    { name: 'Assiette de merguez', description: null, price: 3000, categoryId: catMap.get('grillades')!, order: 12 },
    { name: 'Assiette de saucisse', description: null, price: 4000, categoryId: catMap.get('grillades')!, order: 13 },
    { name: 'Mix Deen\'s Grill / 02 personnes', description: 'Bœuf, mouton, ailerons de dinde, merguez, saucisses', price: 12500, categoryId: catMap.get('grillades')!, order: 14, featured: true },
    { name: 'Poisson braisé aux légumes', description: null, price: 5000, categoryId: catMap.get('grillades')!, order: 15 },
    { name: 'Mix gourmand', description: 'Riz gras, poulet, Shawarma, frites', price: 10000, categoryId: catMap.get('grillades')!, order: 16, featured: true },
    { name: 'Mix Amore Mio', description: 'Jardinière, Poulet, Attiéké, Merguez, Saucisse, Frites/Alloco', price: 12500, categoryId: catMap.get('grillades')!, order: 17 },
    { name: 'Choucouya Poulet', description: 'Poulet, Attiéké, Alloco/Frites', price: 10000, categoryId: catMap.get('grillades')!, order: 18 },

    // Accompagnements
    { name: 'Alloco', description: null, price: 1000, categoryId: catMap.get('accompagnements')!, order: 1 },
    { name: 'Frites de pommes de terre', description: null, price: 1000, categoryId: catMap.get('accompagnements')!, order: 2 },
    { name: 'Riz', description: null, price: 1000, categoryId: catMap.get('accompagnements')!, order: 3 },
    { name: 'Attiéké', description: null, price: 1000, categoryId: catMap.get('accompagnements')!, order: 4 },
    { name: 'Couscous', description: null, price: 1000, categoryId: catMap.get('accompagnements')!, order: 5 },
    { name: 'Petit pois', description: null, price: 1000, categoryId: catMap.get('accompagnements')!, order: 6 },

    // Boissons
    { name: 'Bissap', description: 'Naturelle', price: 1000, categoryId: catMap.get('boissons')!, order: 1 },
    { name: 'Gingembre', description: 'Naturelle', price: 1000, categoryId: catMap.get('boissons')!, order: 2 },
    { name: 'Tamarin', description: 'Naturelle', price: 1000, categoryId: catMap.get('boissons')!, order: 3 },
    { name: 'Coca', description: 'Soft', price: 1000, categoryId: catMap.get('boissons')!, order: 4 },
    { name: 'Fanta', description: 'Soft', price: 1000, categoryId: catMap.get('boissons')!, order: 5 },
    { name: 'Sprite', description: 'Soft', price: 1000, categoryId: catMap.get('boissons')!, order: 6 },
    { name: 'Schweppes', description: 'Soft', price: 1000, categoryId: catMap.get('boissons')!, order: 7 },

    // Cocktails
    { name: 'Tropical Spritzer', description: 'Mangue-pêche, limonade-grenadine', price: 2500, categoryId: catMap.get('cocktails')!, order: 1, featured: true },
    { name: 'Bora Bora', description: 'Ananas-passion, grenadine-citron', price: 2500, categoryId: catMap.get('cocktails')!, order: 2 },
    { name: 'Sunset', description: 'Pastèque-citron-menthe, mandarine', price: 2500, categoryId: catMap.get('cocktails')!, order: 3 },
    { name: 'Mojito', description: 'Sirop de canne-citron, menthe-limonade', price: 2500, categoryId: catMap.get('cocktails')!, order: 4 },
    { name: 'Ananas Lovers', description: 'Ananas-citron, sirop de canne', price: 2500, categoryId: catMap.get('cocktails')!, order: 5 },
    { name: 'Deen\'s Grill', description: 'Grenadine-Orange, limonade', price: 2500, categoryId: catMap.get('cocktails')!, order: 6, featured: true },
    { name: 'Baby', description: 'Sirop de menthe-lait', price: 2500, categoryId: catMap.get('cocktails')!, order: 7 },
    { name: 'Diabolo', description: 'Sirop de menthe/grenadine - Sprite', price: 2500, categoryId: catMap.get('cocktails')!, order: 8 },

    // Cafés
    { name: 'Expresso', description: '+ 1 bouteille d\'eau', price: 1000, categoryId: catMap.get('cafes')!, order: 1 },
    { name: 'Cappuccino', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 2 },
    { name: 'Café long', description: '+ 1 bouteille d\'eau', price: 1000, categoryId: catMap.get('cafes')!, order: 3 },
    { name: 'Café latte', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 4 },
    { name: 'Café crème', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 5 },
    { name: 'Café Americano', description: '+ 1 bouteille d\'eau', price: 1000, categoryId: catMap.get('cafes')!, order: 6 },
    { name: 'Hot Milk Foam', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 7 },
    { name: 'Ristretto', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 8 },
    { name: 'Latte Macchiato', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 9 },
    { name: 'Flat White', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 10 },
    { name: 'Cold Coffee', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 11 },
    { name: 'Oulei Coffee', description: null, price: 1000, categoryId: catMap.get('cafes')!, order: 12 },

    // Thés
    { name: 'Thé à la menthe', description: null, price: 1000, categoryId: catMap.get('thes')!, order: 1 },
    { name: 'Thé petit cola + gingembre', description: null, price: 1000, categoryId: catMap.get('thes')!, order: 2 },
    { name: 'Thé citronnelle + kinkeliba', description: null, price: 1000, categoryId: catMap.get('thes')!, order: 3 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: `${item.categoryId}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
      update: {},
      create: { ...item, id: `${item.categoryId}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
    });
  }

  console.log('✅ Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
