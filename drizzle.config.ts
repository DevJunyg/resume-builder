import { defineConfig } from "drizzle-kit";

// 마이그레이션: npm run db:generate (SQL 생성) → npm run db:migrate (DB 적용)
// db:migrate는 DATABASE_URL 필요 (.env.local)
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
