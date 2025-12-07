import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  // Safe fallback for build environment where env vars might be missing
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "postgresql://build:build@localhost:5432/build";

  return new PrismaClient({
    // @ts-ignore - datasources is valid at runtime but types might be strict
    datasources: {
      db: {
        url,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
