import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'mhk@27mediaagency.com';
  const password = process.env.SUPER_ADMIN_INITIAL_PASSWORD || 'mhk2279';

  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ Super admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.superAdmin.create({
    data: {
      email,
      passwordHash,
      mustChangePassword: true,
    },
  });

  console.log(`✅ Super admin seeded: ${email} (must change password on first login)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
