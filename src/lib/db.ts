import { PrismaClient } from '@prisma/client'

// Singleton pattern with model-availability check.
// If the cached PrismaClient doesn't have the models we need (which can
// happen when the Prisma client is regenerated mid-session in dev), create
// a fresh one. This is a no-op in production (the singleton is always fresh).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check that the cached client has ALL the models we need. If it doesn't
// (e.g. the schema was extended mid-session in dev with new models),
// discard it and create a new one.
const cached = globalForPrisma.prisma;
const hasModels =
  cached &&
  typeof cached.subscriber === 'object' &&
  typeof cached.contactMessage === 'object' &&
  typeof cached.order === 'object' &&
  typeof cached.orderItem === 'object' &&
  typeof cached.ebookDownloadToken === 'object';

export const db =
  (hasModels ? cached : new PrismaClient({ log: ['query'] })) as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
