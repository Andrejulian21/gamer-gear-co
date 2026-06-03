import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

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
  console.log('✅ Admin user created:', admin.email);

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
  console.log('✅ Sample user created:', user.email);

  console.log('🎉 Seed completed!');
  console.log('');
  console.log('Credentials:');
  console.log('  Admin: admin@gamerstore.co / Admin123!');
  console.log('  User:  juan@example.com / User1234!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
