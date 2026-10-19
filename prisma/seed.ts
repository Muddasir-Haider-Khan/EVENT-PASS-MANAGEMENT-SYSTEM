import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Bootstrap only: creates the first super admin from SUPER_ADMIN_EMAIL /
 * SUPER_ADMIN_INITIAL_PASSWORD when the database has none. Existing accounts
 * are never modified, so running this against a live database is a no-op.
 */
async function main() {
  const existing = await prisma.superAdmin.count();
  if (existing > 0) {
    console.log(`Super admin already present (${existing}) — nothing to seed.`);
    return;
  }

  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_INITIAL_PASSWORD;
  if (!email || !password) {
    throw new Error('Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_INITIAL_PASSWORD to create the first super admin.');
  }

  await prisma.superAdmin.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
    },
  });
  console.log(`Created first super admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
