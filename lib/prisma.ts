import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  // Ensure DATABASE_URL is set for build environment
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = "postgresql://build:build@localhost:5432/build";
  }

  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
