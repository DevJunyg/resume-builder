# EC2 올인원 배포 (Next.js + nginx + HTTPS, 무료 도메인)

Vercel 대신 **EC2 한 대에 앱과 DB를 모두** 올리고, 무료 도메인 + HTTPS로 서비스한다.
DB(5432)는 localhost로 닫아 **인터넷 노출을 없애는 것**이 이 구성의 핵심 이득이다.
(앞선 `docs/db-ec2.md`에서 만든 그 EC2 + PostgreSQL을 그대로 재사용한다.)

```
인터넷 ──443/80──▶ nginx (EC2) ──▶ Next.js (127.0.0.1:3000, systemd)
                                    └▶ PostgreSQL (127.0.0.1:5432)  ← 외부 차단
```

> 이 문서는 무료/학습용 구성이다. Vercel이 공짜로 해주던 빌드·HTTPS·프로세스 관리·무중단 배포를
> 직접 손으로 해보는 게 목적. 진짜 프로덕션은 관리형(ALB+ACM+ECS, `docs/db-stage2-ecs.md`)이 정석.

## 전제

- Ubuntu 24.04 EC2 + PostgreSQL 18 (`docs/db-ec2.md` 완료 상태)
- 무료 도메인 A레코드가 EC2를 가리킴 — 예: `resumebuilder.kro.kr`
- GitHub OAuth 앱 (콜백 URL을 새 도메인으로 바꿀 것)

> ⚠️ **`kro.kr` HTTPS 주의**: `kro.kr`은 Public Suffix List에 없어, Let's Encrypt의 "등록 도메인당
> 주 50장" 한도를 `kro.kr` 전체 사용자가 **공유**한다. certbot이 `too many certificates already
> issued for: kro.kr`로 실패할 수 있다. 그 경우 §5-B의 **acme.sh + ZeroSSL**로 우회한다.

---

## 0. 사전 — 고정 IP + 보안그룹 + A레코드

1. **탄력적 IP(Elastic IP) 할당 후 EC2에 연결.**
   EIP가 없으면 EC2 중지/시작 시 퍼블릭 IP가 바뀌어 A레코드가 깨진다.
2. 도메인 A레코드를 그 **EIP**로 맞춘다 (`nslookup resumebuilder.kro.kr` → EIP).
3. 보안그룹 인바운드: **HTTP(80)**, **HTTPS(443)** 를 `0.0.0.0/0` 으로 연다.
   (5432는 §7에서 제거한다. 22는 내 IP 유지.)

---

## 1. Node.js 설치 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v      # v22.x
npm -v
```

---

## 2. 레포 클론 · 환경변수 · 빌드

```bash
cd ~
git clone https://github.com/DevJunyg/resume-builder.git
cd resume-builder
npm ci
```

`.env.production` 생성 (서버에서만, 커밋 금지):

```bash
cat > .env.production <<'ENV'
# 앱 URL — NEXT_PUBLIC_* 는 빌드 시점에 코드에 박히므로 build 전에 있어야 함
NEXT_PUBLIC_APP_URL=https://resumebuilder.kro.kr

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# DB — 같은 호스트라 localhost, SSL 미설정이므로 sslmode 없음
DATABASE_URL=postgresql://appuser:비번@localhost:5432/resumebuilder

# Auth.js (GitHub) — 리버스 프록시 뒤이므로 TRUST_HOST 필수
AUTH_SECRET=...            # npx auth secret 로 생성
AUTH_URL=https://resumebuilder.kro.kr
AUTH_TRUST_HOST=true
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
ENV
```

> `AUTH_TRUST_HOST=true` 가 없으면 nginx 뒤에서 Auth.js가 호스트를 신뢰하지 않아 **로그인 콜백이 깨진다**.
> Vercel에선 자동으로 처리되던 부분.

빌드:

```bash
npm run build
```

---

## 3. systemd 서비스로 앱 상시 실행 (:3000)

```bash
sudo tee /etc/systemd/system/resume.service > /dev/null <<EOF
[Unit]
Description=resume-builder (Next.js)
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/resume-builder
EnvironmentFile=/home/ubuntu/resume-builder/.env.production
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now resume
sudo systemctl status resume         # active (running) 확인
curl -I http://localhost:3000        # 200/307 이면 앱 정상
```

> 코드 업데이트 시: `git pull && npm ci && npm run build && sudo systemctl restart resume`

---

## 4. nginx 리버스 프록시

```bash
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/resume > /dev/null <<'EOF'
server {
    listen 80;
    server_name resumebuilder.kro.kr;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # SSE 스트리밍(채팅)용 — 버퍼링 끄기
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/resume /etc/nginx/sites-enabled/resume
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

이제 `http://resumebuilder.kro.kr` 로 앱이 떠야 한다(HTTP).

---

## 5. HTTPS

### 5-A. Let's Encrypt (certbot) — 먼저 시도

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d resumebuilder.kro.kr --redirect -m 내이메일@example.com --agree-tos --no-eff-email
```

성공하면 nginx에 443 블록과 HTTP→HTTPS 리다이렉트가 자동 추가되고, 인증서는 자동 갱신된다.
`https://resumebuilder.kro.kr` 확인.

### 5-B. 실패 시 (`too many certificates ... kro.kr`) — acme.sh + ZeroSSL

Let's Encrypt 공유 한도에 막히면 다른 무료 CA(ZeroSSL)로 발급한다.

```bash
curl https://get.acme.sh | sh -s email=내이메일@example.com
source ~/.bashrc
# ZeroSSL이 acme.sh 기본 CA. webroot(HTTP-01)로 발급
sudo mkdir -p /var/www/html
~/.acme.sh/acme.sh --issue -d resumebuilder.kro.kr -w /var/www/html
# nginx에 설치 + 재로드 훅
sudo mkdir -p /etc/nginx/ssl
~/.acme.sh/acme.sh --install-cert -d resumebuilder.kro.kr \
  --key-file /etc/nginx/ssl/resume.key \
  --fullchain-file /etc/nginx/ssl/resume.crt \
  --reloadcmd "sudo systemctl reload nginx"
```

그다음 nginx에 443 서버블록을 수동 추가(`ssl_certificate /etc/nginx/ssl/resume.crt; ssl_certificate_key /etc/nginx/ssl/resume.key;`)하고 80→443 리다이렉트를 건다.
(webroot 챌린지를 위해 80 블록에 `location /.well-known/acme-challenge/ { root /var/www/html; }` 추가.)

---

## 6. GitHub OAuth 콜백 + 재시작

1. GitHub → OAuth App 설정:
   - Homepage URL: `https://resumebuilder.kro.kr`
   - Authorization callback URL: `https://resumebuilder.kro.kr/api/auth/callback/github`
2. `.env.production`의 `AUTH_URL`/`NEXT_PUBLIC_APP_URL`이 새 도메인인지 확인
3. `sudo systemctl restart resume`

---

## 7. DB 잠그기 (인터넷 노출 제거) — 이 구성의 핵심 이득

앱이 같은 호스트에 있으니 이제 5432를 외부에 열 필요가 없다.

```bash
# 1) 로컬만 수신하도록 되돌리기
sudo sed -i "s/^listen_addresses = '\*'/listen_addresses = 'localhost'/" /etc/postgresql/18/main/postgresql.conf
# 2) 원격 허용 규칙(0.0.0.0/0) 제거 — 해당 라인을 지운다
sudo sed -i "/^host  *all  *all  *0\.0\.0\.0\/0/d" /etc/postgresql/18/main/pg_hba.conf
sudo systemctl restart postgresql
sudo ss -tlnp | grep 5432     # 127.0.0.1:5432 만 보여야 함
```

그리고 **보안그룹에서 5432 인바운드 규칙을 삭제**한다. 이제 DB는 EC2 내부에서만 접근 가능.

> DBeaver 등으로 원격 접속하려면 SSH 터널(`ssh -L 5432:localhost:5432 ...`)을 쓴다.

---

## 8. 검증 & 운영

- `https://resumebuilder.kro.kr` 접속 → 이력서 편집 → GitHub 로그인 → 저장 확인
- 자물쇠(HTTPS) 정상, 채팅 스트리밍 동작 확인
- 인증서 자동 갱신: certbot은 systemd timer로, acme.sh는 cron으로 자동
- 앱 로그: `journalctl -u resume -f` / nginx: `/var/log/nginx/`
- 문제 시 점검 순서: 앱(`curl localhost:3000`) → nginx(`nginx -t`) → 방화벽(SG 80/443) → DNS(`nslookup`)

## 현업 학습 포인트

- **리버스 프록시**: TLS 종단·헤더 전달·정적 캐싱을 nginx가 맡고 앱은 평문 3000만 신경.
- **프로세스 관리(systemd)**: 크래시 자동 재시작·부팅 시 자동 기동 — Vercel이 대신하던 것.
- **X-Forwarded-* 헤더 + AUTH_TRUST_HOST**: 프록시 뒤 앱이 원 요청의 scheme/host를 알게 하는 표준.
- **DB 비공개화**: 앱과 DB를 같은 경계 안에 두어 공격면을 줄이는 기본 원칙.
- **무료 CA/도메인의 함정**: Public Suffix List와 rate limit — 실서비스 인증서 운영의 현실.
