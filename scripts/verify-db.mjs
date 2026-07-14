// DB 스키마 검증 스크립트 — 실제 Postgres 없이 PGlite(인프로세스 Postgres)로
// 생성된 마이그레이션 SQL을 적용하고 API가 쓰는 쿼리 경로(upsert 등)를 검증한다.
// 실행: npm run db:verify
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const db = new PGlite();
let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failed++;
};

// 1) 마이그레이션 적용
const dir = "drizzle";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");
  for (const stmt of sql.split("--> statement-breakpoint")) {
    const s = stmt.trim();
    if (s) await db.exec(s);
  }
}
check(`마이그레이션 적용 (${files.join(", ")})`, true);

// 2) 사용자 생성 + 이력서 upsert (API PUT 경로와 동일한 SQL 패턴)
await db.query(
  `INSERT INTO users (id, name, email) VALUES ('u1', '테스트', 't@t.com')`
);
const resumeV1 = JSON.stringify({ id: "default", version: 1 });
const resumeV2 = JSON.stringify({ id: "default", version: 2 });

await db.query(
  `INSERT INTO resumes (id, user_id, data) VALUES ('r1', 'u1', $1)
   ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
  [resumeV1]
);
await db.query(
  `INSERT INTO resumes (id, user_id, data) VALUES ('r2', 'u1', $1)
   ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
  [resumeV2]
);
const { rows } = await db.query(`SELECT id, data FROM resumes WHERE user_id = 'u1'`);
check("upsert: 사용자당 1행 유지", rows.length === 1);
check("upsert: 데이터가 최신본으로 갱신", rows[0].data.version === 2);
check("upsert: 기존 행 id 유지(교체 아님)", rows[0].id === "r1");

// 3) FK cascade — 사용자 삭제 시 이력서/세션도 정리
await db.query(
  `INSERT INTO sessions (session_token, user_id, expires) VALUES ('s1', 'u1', now() + interval '1 day')`
);
await db.query(`DELETE FROM users WHERE id = 'u1'`);
const r2 = await db.query(`SELECT count(*)::int AS c FROM resumes`);
const s2 = await db.query(`SELECT count(*)::int AS c FROM sessions`);
check("cascade: 사용자 삭제 시 이력서 삭제", r2.rows[0].c === 0);
check("cascade: 사용자 삭제 시 세션 삭제", s2.rows[0].c === 0);

console.log(failed === 0 ? "\n✅ DB 스키마 검증 통과" : `\n❌ ${failed}건 실패`);
process.exit(failed === 0 ? 0 : 1);
