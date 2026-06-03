import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // TODO Phase 1: Seed admin user, brands, categories, products
  // Brands: Razer, Logitech G, Corsair, HyperX, Redragon
  // Categories: Mice, Keyboards, Headsets, Mousepads
  console.log('Seed not yet implemented. Will be added in Phase 1.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
