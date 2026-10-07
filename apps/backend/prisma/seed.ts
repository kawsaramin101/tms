import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const adapter = new PrismaMariaDb(
  (process.env.DATABASE_URL ?? "").replace(/^mysql:\/\//, "mariadb://"),
);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@vault.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists.`);
    return;
  }

  await prisma.user.create({
    data: {
      name: "Administrator",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`Created admin user ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
