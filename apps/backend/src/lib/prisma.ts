import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "../config/env.js";

const url = env.databaseUrl.replace(/^mysql:\/\//, "mariadb://");
const adapter = new PrismaMariaDb(url);

export const prisma = new PrismaClient({ adapter });
