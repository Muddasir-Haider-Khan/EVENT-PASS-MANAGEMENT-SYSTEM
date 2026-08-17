import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_INITIAL_PASSWORD;

  if (!email || !password) {
    console.error('❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_INITIAL_PASSWORD must be set in .env');
    process.exit(1);
  }

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
