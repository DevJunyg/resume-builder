# DB & 인증 (AWS RDS PostgreSQL + Auth.js)

로그인(GitHub OAuth)하면 이력서가 RDS에 저장되어 기기 간 이어서 작성할 수 있다.
비로그인 시엔 기존처럼 localStorage만 사용한다.

> 이 문서는 **1단계**(Vercel 런타임 + RDS public) 기준이다.
> 프라이빗 RDS + ECS + HTTPS로 승격하는 **2단계 계획은 `docs/db-stage2-ecs.md`** 참고.

## 구성

| 레이어 | 선택 | 이유 |
| --- | --- | --- |
| DB | **AWS RDS PostgreSQL** (db.t4g.micro, 서울) | 현업 표준. 프리티어/크레딧으로 무료 실습 |
| ORM/마이그레이션 | **Drizzle** (`lib/db/schema.ts` → `drizzle/*.sql`) | 스키마를 코드로 버전관리, SQL에 가까움 |
| 인증 | **Auth.js v5** GitHub OAuth, DB 세션 | BaaS 없이 직접 구현 (현업 방식) |
| 검증 | zod `ResumeSchema`로 서버사이드 검증 | 클라이언트 불신 원칙 |

테이블: `users`/`accounts`/`sessions`/`verification_tokens`(Auth.js 표준) + `resumes`(이력서 jsonb, 사용자당 1개 unique).

## 스키마 변경 워크플로 (현업 방식)

```bash
# 1. lib/db/schema.ts 수정
# 2. SQL 마이그레이션 생성 (커밋 대상)
npm run db:generate
# 3. DB 적용 (.env.local의 DATABASE_URL 사용)
npm run db:migrate
# 4. DB 없이 스키마/쿼리 검증 (PGlite 인프로세스 Postgres)
npm run db:verify
```

---

## 최초 설정 (1회)

### 1. RDS 인스턴스 생성 (콘솔 권장, 서울 리전)

RDS → Create database:
- **Standard create** / **PostgreSQL** (16.x)
- Templates: **Free tier** (없으면 Dev/Test + Single-AZ)
- DB instance: **db.t4g.micro**, 스토리지 20GB gp3, 자동 스케일링 OFF
- DB instance identifier: `resume-builder-db` / Master username: `postgres` / 비밀번호: 강하게
- **Public access: Yes** ← Vercel(고정 IP 없음)에서 접속하기 위함
- VPC security group: 새로 생성 `resume-builder-db-sg`
- Additional configuration → Initial database name: `resumebuilder`

생성 후 보안그룹 인바운드 규칙: PostgreSQL(5432), Source `0.0.0.0/0`.

> ⚠️ **실습용 타협**: 현업에서는 DB를 프라이빗 서브넷에 두고 앱(같은 VPC)만 접근시킨다.
> Vercel은 고정 IP가 없어 public + 전체 오픈으로 여는 것 — 강한 비밀번호와 SSL이 방어선이다.
> 나중에 ECS로 앱을 되살리면 같은 VPC 프라이빗 배치로 바꾸는 게 정석.

### 2. DATABASE_URL 구성

```
postgresql://postgres:<비밀번호>@<RDS 엔드포인트>:5432/resumebuilder?sslmode=require
```
비밀번호에 특수문자가 있으면 URL 인코딩 필요 (`@` → `%40` 등).

> SSL 참고: RDS CA가 Node 기본 신뢰 저장소에 없어 `lib/db/index.ts`는 인증서 검증을
> 생략한다(`rejectUnauthorized: false`). 강화하려면 RDS 글로벌 CA 번들을 받아 `ca`로 지정.

### 3. 마이그레이션 적용

```bash
# .env.local에 DATABASE_URL 넣고
npm run db:migrate
```

### 4. GitHub OAuth 앱 생성 (로컬/배포 각 1개 권장)

GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App:

| 필드 | 로컬용 | 배포용 |
| --- | --- | --- |
| Homepage URL | `http://localhost:3000` | `https://<vercel 도메인>` |
| Callback URL | `http://localhost:3000/api/auth/callback/github` | `https://<vercel 도메인>/api/auth/callback/github` |

Client ID → `AUTH_GITHUB_ID`, Client secret 생성 → `AUTH_GITHUB_SECRET`.

### 5. 환경변수 등록

- 로컬: `.env.local` (`.env.local.example` 참고) — `AUTH_SECRET`은 `npx auth secret`으로 생성
- Vercel: Settings → Environment Variables에 `DATABASE_URL`, `AUTH_SECRET`,
  `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` 등록 (Production + Preview)

### 6. 확인

로컬 `npm run dev` → `/builder` → 우상단 **로그인** → GitHub 승인 →
이력서 수정 시 "저장 중 → 저장됨" 뱃지. 다른 브라우저에서 로그인하면 같은 이력서가 뜬다.

---

## 동기화 규칙 (lib/use-cloud-sync.ts)

- 로그인 직후: 서버 저장본이 있으면 **서버 우선**(기기 간 이어쓰기), 없으면 로컬을 첫 업로드
- 이후 변경: 1.5초 디바운스로 PUT (last-write-wins)
- 비로그인/DB 미설정: localStorage만 사용 — 기능 저하 없이 동작

## 현업 학습 포인트

- **커넥션 풀링**: 서버리스는 함수 인스턴스마다 풀을 만들므로 `max`를 작게(3) 잡았다.
  트래픽 증가 시 커넥션 고갈 → **RDS Proxy**/pgbouncer가 해법 (RDS Proxy는 유료 ~$11/월).
- **마이그레이션 파일 커밋**: 스키마 이력이 코드 리뷰 대상이 된다 (`drizzle/`).
- **서버 검증**: PUT에서 zod로 재검증 — 클라이언트가 보낸 jsonb를 그대로 믿지 않는다.
