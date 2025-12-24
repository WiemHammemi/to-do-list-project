import { PrismaClient } from "@prisma/client";

const global = globalThis as unknown as{
   prisma: PrismaClient | undefined;
}

 export const prisma =
  global.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

