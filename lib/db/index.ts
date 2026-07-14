import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// pg Pool은 lazy-connect — DATABASE_URL이 없어도 생성 시점엔 에러가 없고
// 실제 쿼리 시점에 연결을 시도하므로 빌드/CI(환경변수 없음)에서 안전하다.
// dev 핫리로드 시 커넥션 누적을 막기 위해 globalThis에 캐시.
const globalForDb = globalThis as unknown as { dbPool?: Pool };

const pool =
  globalForDb.dbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // 서버리스(Vercel) 함수 인스턴스당 커넥션 최소화 — RDS 커넥션 고갈 방지.
    // 트래픽이 커지면 RDS Proxy 또는 pgbouncer 도입 지점 (docs/db.md 참고)
    max: 3,
    // RDS는 SSL 필수. AWS RDS CA가 Node 기본 신뢰 저장소에 없어 검증은 생략.
    // (현업 강화판: RDS 글로벌 CA 번들을 받아 rejectUnauthorized: true + ca 지정)
    ssl: process.env.DATABASE_URL?.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.dbPool = pool;

export const db = drizzle(pool, { schema });
