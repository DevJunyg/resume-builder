// DB 스키마 검증 — 실제 Postgres 없이 PGlite(인프로세스 Postgres)로 마이그레이션을
// 순서대로 적용하고 API가 쓰는 쿼리 경로(다중 이력서, 대화 cascade)를 검증한다.
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

// 1) 마이그레이션 순서대로 적용
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

// 2) 다중 이력서 — 한 사용자가 여러 개 (unique 제거 확인)
await db.query(`INSERT INTO users (id, name, email) VALUES ('u1', '테스트', 't@t.com')`);
await db.query(
  `INSERT INTO resumes (id, user_id, title, data) VALUES
   ('r1', 'u1', '이력서 A', '{"v":1}'),
   ('r2', 'u1', '이력서 B', '{"v":2}')`
);
const list = await db.query(
  `SELECT id, title FROM resumes WHERE user_id = 'u1' ORDER BY title`
);
check("다중 이력서: 한 사용자에 2개 저장", list.rows.length === 2);

// 3) 이력서별 대화 — 시간순 정렬
await db.query(
  `INSERT INTO chat_messages (id, resume_id, role, content, created_at) VALUES
   ('m1', 'r1', 'user',      '안녕',      now() - interval '2 sec'),
   ('m2', 'r1', 'assistant', '반가워요',  now() - interval '1 sec'),
   ('m3', 'r2', 'user',      '다른 이력서', now())`
);
const r1msgs = await db.query(
  `SELECT content FROM chat_messages WHERE resume_id = 'r1' ORDER BY created_at`
);
check("대화: 이력서별 분리 + 시간순", r1msgs.rows.length === 2 && r1msgs.rows[0].content === "안녕");

// 4) 이력서 삭제 → 그 이력서의 대화만 cascade 삭제 (다른 이력서는 유지)
await db.query(`DELETE FROM resumes WHERE id = 'r1'`);
const afterDel = await db.query(`SELECT count(*)::int AS c FROM chat_messages WHERE resume_id = 'r1'`);
const r2still = await db.query(`SELECT count(*)::int AS c FROM chat_messages WHERE resume_id = 'r2'`);
check("cascade: 이력서 삭제 시 해당 대화만 삭제", afterDel.rows[0].c === 0);
check("cascade: 다른 이력서 대화는 유지", r2still.rows[0].c === 1);

// 5) 사용자 삭제 → 모든 이력서 + 대화 cascade
await db.query(`DELETE FROM users WHERE id = 'u1'`);
const resumesLeft = await db.query(`SELECT count(*)::int AS c FROM resumes`);
const msgsLeft = await db.query(`SELECT count(*)::int AS c FROM chat_messages`);
check("cascade: 사용자 삭제 시 이력서 전부 삭제", resumesLeft.rows[0].c === 0);
check("cascade: 사용자 삭제 시 대화 전부 삭제", msgsLeft.rows[0].c === 0);

console.log(failed === 0 ? "\n✅ DB 스키마 검증 통과" : `\n❌ ${failed}건 실패`);
process.exit(failed === 0 ? 0 : 1);
