# 2단계 계획: ECS 프로덕션 구성 (프라이빗 RDS + HTTPS)

> 상태: **계획 문서** — 1단계(Vercel + RDS public, `docs/db.md`)가 동작한 뒤 진행.
> 목표: "실습용 타협"을 걷어내고 현업 표준 아키텍처로 승격한다.

## 왜 2단계인가 — 1단계에 남아있는 타협

| 항목 | 1단계 (현재) | 2단계 (목표) |
| --- | --- | --- |
| DB 노출 | RDS **public** + SG 전체 오픈 | **프라이빗 서브넷**, ECS 서비스 SG만 접근 |
| 시크릿 | Vercel 대시보드 env | **SSM Parameter Store** → task definition 주입 |
| HTTPS | Vercel이 자동 제공 | **도메인 + ACM 인증서 + ALB HTTPS 리스너** |
| 런타임 | Vercel 서버리스 (풀 max 3) | ECS 상시 컨테이너 (일반 풀 10~20) |
| 배포 | Vercel 자동 | 기존 deploy.yml (OIDC→ECR→ECS) 재활성화 |

**HTTPS가 선결 조건인 이유**: OAuth 로그인은 프로덕션에서 secure 쿠키를 사용한다.
ALB의 `http://…elb.amazonaws.com` 주소로는 쿠키가 저장되지 않아 로그인이 동작하지 않는다.
→ 도메인 1개 구입(연 1~2만원)이 사실상 유일한 준비물.

## 목표 아키텍처

```
사용자 ──HTTPS──> Route53(도메인) ──> ALB(ACM 인증서, 443)
                                        │ (HTTP 80 → 443 리다이렉트)
                                        ▼
                              ECS Fargate (프라이빗 or 퍼블릭 서브넷)
                               │  시크릿: SSM Parameter Store
                               ▼ 5432 (SG 체이닝: svc-sg → db-sg)
                              RDS PostgreSQL (Publicly accessible: No)
```

Vercel은 폐기하지 않고 **프리뷰/데모용**으로 유지 — DB env를 빼면 자동으로
localStorage 전용 모드로 동작한다(코드가 이미 env-gated).

---

## Phase A — 도메인 + 인증서 (준비물)

1. 도메인 구입 — Route53에서 직접 구입(관리 일원화) 또는 외부 등록기관 + Route53 호스티드 존
2. **ACM**(서울 리전)에서 인증서 요청 → DNS 검증 (Route53이면 버튼 한 번)
3. 완료 기준: ACM 상태 `Issued`

## Phase B — ECS 부활 + HTTPS

기존 자산 재사용: ECR 이미지·클러스터·태스크 실행 역할·deploy.yml은 남아있음.

1. ALB + 타깃그룹 재생성 (이전 Stage 2 스크립트 재사용 — idempotent)
2. ALB에 **HTTPS(443) 리스너** + ACM 인증서 연결, HTTP(80)는 443 리다이렉트로 변경
3. Route53 A(Alias) 레코드: `resume.<도메인>` → ALB
4. task definition에 시크릿 추가 (SSM):
   ```jsonc
   "secrets": [
     { "name": "ANTHROPIC_API_KEY", "valueFrom": ".../resume-builder/ANTHROPIC_API_KEY" },
     { "name": "DATABASE_URL",      "valueFrom": ".../resume-builder/DATABASE_URL" },
     { "name": "AUTH_SECRET",       "valueFrom": ".../resume-builder/AUTH_SECRET" },
     { "name": "AUTH_GITHUB_ID",    "valueFrom": ".../resume-builder/AUTH_GITHUB_ID" },
     { "name": "AUTH_GITHUB_SECRET","valueFrom": ".../resume-builder/AUTH_GITHUB_SECRET" }
   ],
   "environment": [
     { "name": "AUTH_URL", "value": "https://resume.<도메인>" },
     { "name": "AUTH_TRUST_HOST", "value": "true" }  // ALB 뒤 호스트 신뢰
   ]
   ```
5. ECS 서비스 재생성 (desired 1, 타깃그룹 연결)
6. GitHub OAuth 앱에 콜백 추가: `https://resume.<도메인>/api/auth/callback/github`
7. GitHub Variables `AWS_ROLE_ARN` 복원 → deploy.yml 자동배포 재활성화
8. 검증: `curl https://resume.<도메인>/api/version` + 로그인/저장 E2E

## Phase C — RDS 프라이빗 전환 (보안 조이기)

> 앱이 ECS(같은 VPC)에서 도는 것을 확인한 **후에** 진행 — 순서 중요.

1. db-sg 인바운드를 `0.0.0.0/0` → **`source: svc-sg`** (SG 체이닝)으로 교체
2. RDS Modify → **Publicly accessible: No** (즉시 적용)
3. (정석 마무리) 프라이빗 서브넷 2개 + 프라이빗 전용 DB 서브넷 그룹 생성 후 이동
   — 3번은 재시작 수반, 1·2만으로도 외부 접근은 차단됨
4. 이후 로컬에서 `db:migrate`가 필요할 때: 임시로 내 IP만 SG에 추가/제거
   (현업에선 bastion/SSM 포트포워딩 — 선택 학습거리)
5. lib/db의 풀 `max`를 ECS용으로 상향 검토 (3 → 10)

## Phase D — 마무리

- Vercel의 `DATABASE_URL` 등 DB env 제거 → Vercel은 localStorage 데모 모드로
- CloudWatch: ALB 5xx / ECS CPU 알람 1~2개 (관측성 맛보기)
- `docs/db.md`의 "실습용 타협" 문구 갱신

## 비용 (서울, 대략)

| 리소스 | 월 비용 |
| --- | --- |
| ALB | ~$17 |
| Fargate 0.25vCPU/0.5GB 상시 1태스크 | ~$9 |
| RDS db.t4g.micro + 20GB | ~$15 (프리티어/크레딧 대상) |
| Route53 호스티드 존 | $0.5 |
| 도메인 | 연 1~2만원 |
| **합계** | **~$42/월** — 신규 계정 크레딧($100~200)으로 2~4개월 커버 |

> 계정이 새 프리티어 **free plan**이면 크레딧 초과 시 과금 대신 서비스가 중지되므로
> 요금 폭탄 위험 없음. Billing → Free Tier에서 플랜/크레딧 잔액 확인.
> 실습 종료 시 정리 순서: ECS 서비스 → ALB/타깃그룹 → RDS(최종 스냅샷) → Route53.

## 완료 기준 (Definition of Done)

- [ ] `https://resume.<도메인>` 에서 GitHub 로그인 → 이력서 저장/복원 동작
- [ ] RDS Publicly accessible = No, db-sg 소스가 svc-sg뿐
- [ ] 시크릿이 코드/이미지/Vercel에 없고 SSM에만 존재
- [ ] main 머지 → deploy.yml → 새 버전 자동 반영 (`/api/version`으로 확인)
