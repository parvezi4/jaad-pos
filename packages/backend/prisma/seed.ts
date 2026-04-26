import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'jaad-cafe' },
    update: {},
    create: {
      name: 'Jaad Cafe',
      slug: 'jaad-cafe',
      tables: {
        create: [
          { number: 1, qrCode: 'JAAD-T1' },
          { number: 2, qrCode: 'JAAD-T2' },
          { number: 3, qrCode: 'JAAD-T3' },
        ],
      },
      categories: {
        create: [
          {
            name: 'Beverages',
            menuItems: {
              create: [
                { name: 'Espresso', description: 'Single shot espresso', price: 25000 },
                { name: 'Latte', description: 'Espresso with steamed milk', price: 35000 },
                { name: 'Cold Brew', description: 'Slow-steeped cold coffee', price: 40000 },
              ],
            },
          },
          {
            name: 'Food',
            menuItems: {
              create: [
                { name: 'Avocado Toast', description: 'Sourdough with smashed avocado', price: 55000 },
                { name: 'Smoked Beef Sandwich', description: 'House-smoked beef with pickles', price: 65000 },
                { name: 'Banana Pancakes', description: 'Fluffy pancakes with banana and syrup', price: 45000 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Seeded restaurant: ${restaurant.name} (${restaurant.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
