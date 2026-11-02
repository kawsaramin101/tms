
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "../config/env.js";

const databaseUrl = new URL(
  env.databaseUrl.replace(/^mysql:\/\//, "mariadb://")
);

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
  connectionLimit: 5,
  acquireTimeout: 10000,
  connectTimeout: 10000,
  ssl: true,
});

const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    voucher: {
      async delete({ args, query }) {
        const voucherId = (
          args as { where?: { voucherId?: number } }
        ).where?.voucherId;

        if (typeof voucherId === "number") {
          await basePrisma.transaction.updateMany({
            where: { voucherId },
            data: { voucherId: null },
          });
        }

        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;
