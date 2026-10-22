import "server-only";

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is defined and points to a writable directory on Vercel / serverless
function initDatabaseEnv() {
  const isServerless = !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "custom.db");
    if (!fs.existsSync(tmpDbPath)) {
      // Find the bundled custom.db file from the build package
      const candidateLocations = [
        path.join(process.cwd(), "db", "custom.db"),
        path.join(process.cwd(), "custom.db"),
        path.resolve("./db/custom.db"),
      ];
      for (const loc of candidateLocations) {
        if (fs.existsSync(loc)) {
          try {
            fs.copyFileSync(loc, tmpDbPath);
            console.log(`[db] Successfully copied sqlite database from ${loc} to ${tmpDbPath}`);
            break;
          } catch (e) {
            console.warn("[db] Failed to copy bundled db to /tmp:", e);
          }
        }
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
    return `file:${tmpDbPath}`;
  }

  if (!process.env.DATABASE_URL) {
    const localDbPath = path.join(process.cwd(), "db", "custom.db");
    process.env.DATABASE_URL = `file:${localDbPath}`;
    return `file:${localDbPath}`;
  }

  return process.env.DATABASE_URL;
}

initDatabaseEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const cached = globalForPrisma.prisma;
const hasModels =
  cached &&
  typeof cached.subscriber === "object" &&
  typeof cached.contactMessage === "object" &&
  typeof cached.order === "object" &&
  typeof cached.orderItem === "object" &&
  typeof cached.ebookDownloadToken === "object" &&
  typeof cached.giftCard === "object" &&
  typeof cached.bookReview === "object" &&
  typeof cached.blogComment === "object";

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient({ log: ["warn", "error"] });
  } catch (err) {
    console.error("[db] PrismaClient initialization error:", err);
    return new PrismaClient();
  }
}

export const db = (hasModels ? cached : createPrismaClient()) as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
