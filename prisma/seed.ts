import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { brands, categories, products } from './seed-catalog';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedUsers() {
  console.log('Seeding users...');
  // Admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gamerstore.co' },
    update: {},
    create: {
      email: 'admin@gamerstore.co',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`  Admin user: ${admin.email}`);

  // Sample user
  const userPassword = await bcrypt.hash('User1234!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: {
      email: 'juan@example.com',
      name: 'Juan Pérez',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log(`  Sample user: ${user.email}`);
}

async function seedBrands() {
  console.log('Seeding brands...');
  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    });
  }
  console.log(`  ${brands.length} brands ready`);
}

async function seedCategories() {
  console.log('Seeding categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`  ${categories.length} categories ready`);
}

async function seedProducts() {
  console.log('Seeding products...');
  // Resolve slug -> id once, then upsert per product.
  const [brandRows, categoryRows] = await Promise.all([
    prisma.brand.findMany({
      where: { slug: { in: brands.map((b) => b.slug) } },
      select: { id: true, slug: true },
    }),
    prisma.category.findMany({
      where: { slug: { in: categories.map((c) => c.slug) } },
      select: { id: true, slug: true },
    }),
  ]);
  const brandIdBySlug = new Map(brandRows.map((b) => [b.slug, b.id]));
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

  for (const product of products) {
    const brandId = brandIdBySlug.get(product.brandSlug);
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!brandId) throw new Error(`Brand not found for slug: ${product.brandSlug}`);
    if (!categoryId) throw new Error(`Category not found for slug: ${product.categorySlug}`);

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { images: product.images },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        images: product.images,
        featured: product.featured,
        brandId,
        categoryId,
      },
    });
  }
  const featuredCount = products.filter((p) => p.featured).length;
  console.log(`  ${products.length} products ready (${featuredCount} featured)`);
}

async function main() {
  console.log('Starting seed...');
  await seedUsers();
  await seedBrands();
  await seedCategories();
  await seedProducts();
  console.log('Seed completed.');
  console.log('');
  console.log('Credentials:');
  console.log('  Admin: admin@gamerstore.co / Admin123!');
  console.log('  User:  juan@example.com / User1234!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
