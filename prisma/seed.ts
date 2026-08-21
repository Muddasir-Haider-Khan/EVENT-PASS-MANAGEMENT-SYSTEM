import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superAdmins = [
    {
      email: process.env.SUPER_ADMIN_EMAIL || 'mhk@27mediaagency.com',
      password: process.env.SUPER_ADMIN_INITIAL_PASSWORD || 'mhk2279',
    },
    {
      email: 'habibullahwahaj@27mediaagency.com',
      password: 'habib5765',
    },
  ];

  for (const admin of superAdmins) {
    const passwordHash = await bcrypt.hash(admin.password, 12);
    await prisma.superAdmin.upsert({
      where: { email: admin.email.toLowerCase() },
      update: {
        passwordHash,
      },
      create: {
        email: admin.email.toLowerCase(),
        passwordHash,
        mustChangePassword: false,
      },
    });
    console.log(`✅ Super admin updated/seeded: ${admin.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
