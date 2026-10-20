import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "../config/env.js";

const url = env.databaseUrl.replace(/^mysql:\/\//, "mariadb://");
const adapter = new PrismaMariaDb(url);

const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    voucher: {
      async delete({ args, query }) {
        const voucherId = (args as { where?: { voucherId?: number } }).where
          ?.voucherId;
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
