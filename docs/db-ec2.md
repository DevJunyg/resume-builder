# EC2 자체 구축 PostgreSQL로 이전 (DB 마이그레이션 실습)

관리형(RDS)에서 **EC2에 직접 설치한 PostgreSQL**로 DB를 옮기는 실습이다.
목표는 두 가지: ① 관리형 vs 자체 관리의 차이를 몸으로 체감, ② `pg_dump`/`pg_restore`로
**실제 데이터 이전**을 경험. 접속은 RDS 때처럼 로컬 PC 없이 **브라우저(EC2 Instance Connect)**로 한다.

> ⚠️ 학습용이다. 운영에서는 백업·패치·HA·모니터링을 대신해 주는 **RDS가 대부분 정답**이다.
> EC2 자체 구축은 통제권↑·비용↓ 대신 운영 부담을 전부 떠안는다는 걸 확인하는 게 이 실습의 핵심.

## 0. 무엇이 바뀌나

| 항목 | RDS (현재) | EC2 자체 구축 |
| --- | --- | --- |
| 프로비저닝 | 콘솔에서 클릭 | EC2 띄우고 `apt install postgresql` |
| 백업 | 자동 스냅샷 | 없음 → `cron` + `pg_dump` 직접 |
| 패치/업그레이드 | 관리형 | 직접 `apt upgrade` |
| 접속 주소 | RDS 엔드포인트 | EC2 퍼블릭 IP(또는 도메인) |
| SSL | 기본 제공(CA 필요) | 기본 꺼짐 → 직접 인증서 설정(§9) |
| 비용 | db.t4g.micro 프리티어 | t3.micro 프리티어(같은 EC2 프리티어 소진) |
| 장애 시 | AWS가 복구 | 내가 SSH 붙어서 복구 |

앱 입장에서 바뀌는 건 **`DATABASE_URL` 한 줄뿐**이다(12-factor: 설정과 코드 분리).

---

## 1. EC2 인스턴스 생성 (콘솔, 서울 리전)

EC2 → 인스턴스 시작:
- **이름**: `resume-builder-ec2-db`
- **AMI**: Ubuntu Server 24.04 LTS (x86_64) — PostgreSQL 16이 기본 패키지
- **인스턴스 유형**: `t3.micro` (서울 프리티어)
- **키 페어**: 새로 생성(`.pem` 다운로드). Instance Connect만 쓸 거면 없어도 되지만 만들어 두자
- **네트워크 설정 → 보안 그룹 새로 생성** `resume-builder-ec2-db-sg`:
  - SSH(22) — 소스 **내 IP**
  - 사용자 지정 TCP(5432) — 소스 **0.0.0.0/0** (⚠️ 실습용, §7 주의 참고)
- **퍼블릭 IP 자동 할당**: 켜기
- 스토리지: 8GB gp3 기본

> Vercel은 고정 IP가 없어서 5432를 열 때 `0.0.0.0/0`으로 여는 것 —
> RDS 실습 때와 같은 타협이다. **강한 비밀번호 + (가능하면) SSL**이 방어선.

---

## 2. 접속 — EC2 Instance Connect (브라우저)

EC2 콘솔 → 인스턴스 선택 → **연결** → **EC2 Instance Connect** 탭 → **연결**.
CloudShell처럼 브라우저 터미널이 열린다(로컬 PC·SSH 키 불필요).

---

## 3. PostgreSQL 설치

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
psql --version                 # psql (PostgreSQL) 16.x 확인
sudo systemctl status postgresql   # active (exited)면 정상
```

설치되면 로컬 소켓으로만 접속되는 `postgres` 슈퍼유저가 생긴다.

---

## 4. 원격 접속 허용 (listen_addresses + pg_hba.conf)

PostgreSQL은 기본적으로 `localhost`만 듣는다. 외부(Vercel)에서 붙게 열어준다.

```bash
# 설치된 메이저 버전 확인 (아래는 16 가정 — 다르면 경로의 16을 바꿔라)
ls /etc/postgresql/

# 1) 모든 인터페이스에서 수신
sudo sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" \
  /etc/postgresql/16/main/postgresql.conf

# 2) 원격 접속 인증 규칙 추가 (scram-sha-256 = 최신 비밀번호 해시)
echo "host  all  all  0.0.0.0/0  scram-sha-256" | \
  sudo tee -a /etc/postgresql/16/main/pg_hba.conf

# 3) 재시작
sudo systemctl restart postgresql
```

> `pg_hba.conf`는 "누가·어디서·어떻게 인증하느냐"를 위에서 아래로 첫 매칭 규칙으로 정한다.
> 실습이라 `0.0.0.0/0`을 열지만, 현업이라면 앱 서버의 보안그룹/CIDR만 허용한다.

---

## 5. DB · 애플리케이션 사용자 생성

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE resumebuilder;
-- ⚠️ 비밀번호에 ! 같은 쉘 특수문자는 피할 것 (CloudShell에서 !! 히스토리 확장으로 깨진 전례)
CREATE USER appuser WITH PASSWORD '강한비밀번호_특수문자없이';
GRANT ALL PRIVILEGES ON DATABASE resumebuilder TO appuser;
\c resumebuilder
GRANT ALL ON SCHEMA public TO appuser;   -- PostgreSQL 15+ 에서 필요
\q
```

---

## 6. 데이터 이전 — 두 가지 경로

### 경로 A. 실제 데이터까지 옮기기 (진짜 마이그레이션, 권장 실습)

EC2에서 RDS로 접속해 덤프를 뜬 뒤, 로컬(EC2) PostgreSQL에 복원한다.
현재 RDS 보안그룹이 `0.0.0.0/0`이라 EC2에서 바로 접속된다(아니라면 RDS SG에 EC2 IP 허용 추가).

```bash
# RDS와 pg_dump 버전을 맞추기 위해 클라이언트도 16이면 OK (위에서 설치됨)

# 1) RDS 전체를 custom 포맷(-Fc)으로 덤프
PGPASSWORD='RDS_마스터_비번' pg_dump \
  -h <RDS_엔드포인트> -U postgres -d resumebuilder -Fc -f rds.dump

# 2) EC2 로컬 PostgreSQL로 복원 (소유자 무시 — appuser로 귀속)
PGPASSWORD='appuser_비번' pg_restore \
  -h localhost -U appuser -d resumebuilder --no-owner rds.dump
```

> `-Fc`(custom) 포맷은 `pg_restore`로 선택 복원·병렬 복원이 가능해 실무 표준이다.
> 순수 SQL 텍스트가 필요하면 `-Fp`(plain) + `psql -f`.

### 경로 B. 스키마만 새로 (데이터가 필요 없을 때)

레포의 마이그레이션 SQL을 순서대로 적용한다(RDS 초기 세팅 때 쓴 방식).

```bash
git clone https://github.com/DevJunyg/resume-builder.git
cd resume-builder
PGPASSWORD='appuser_비번' psql -h localhost -U appuser -d resumebuilder \
  -f drizzle/0000_brown_wildside.sql
PGPASSWORD='appuser_비번' psql -h localhost -U appuser -d resumebuilder \
  -f drizzle/0001_goofy_logan.sql
```

`--> statement-breakpoint`은 `--` 주석이라 psql이 무시한다(무해).

---

## 7. DATABASE_URL 교체

자체 구축 PostgreSQL은 SSL이 꺼진 상태다. 앱은 URL에 `sslmode=require`가 **있을 때만** SSL을
시도하므로(`lib/db/index.ts`), SSL을 안 켰다면 그 옵션을 **빼야** 한다.

```
# SSL 미설정 (§9 안 했을 때)
postgresql://appuser:비번@<EC2_퍼블릭_IP>:5432/resumebuilder
```

Vercel → Settings → Environment Variables → `DATABASE_URL` 수정 → **재배포**.
로컬 테스트면 `.env.local`의 `DATABASE_URL`을 바꾼다.

> ⚠️ SSL 없이 `0.0.0.0/0`이면 비밀번호가 공개망을 **평문**으로 흐른다. 실습이라 감수하되,
> 조금이라도 실서비스로 쓸 거면 §9로 SSL을 켜라.

---

## 8. 검증

```bash
# EC2에서 테이블 확인
PGPASSWORD='appuser_비번' psql -h localhost -U appuser -d resumebuilder -c "\dt"
# users / accounts / sessions / verification_tokens / resumes / chat_messages 가 보여야 함
```

- 앱: 로그인 → 이력서 저장/전환 → 대화 → DBeaver로 **EC2 IP**에 접속해 데이터 반영 확인
- 경로 A로 옮겼다면 기존 RDS 데이터가 그대로 보이는지 확인

---

## 9. (선택) SSL 켜기 — 평문 노출 제거

self-signed 인증서를 만들고 `ssl = on`. 앱 코드는 `rejectUnauthorized: false`라 self-signed도
그대로 붙는다(검증 생략 — 실습 한정).

```bash
sudo -u postgres bash -c '
  cd /var/lib/postgresql/16/main &&
  openssl req -new -x509 -days 365 -nodes -text \
    -out server.crt -keyout server.key -subj "/CN=ec2-pg" &&
  chmod 600 server.key'
sudo sed -i "s/^#\?ssl = .*/ssl = on/" /etc/postgresql/16/main/postgresql.conf
sudo systemctl restart postgresql
```

이제 `DATABASE_URL` 끝에 `?sslmode=require`를 붙이면 앱이 SSL로 연결한다.

---

## 10. 운영 주의 & 정리

- **백업 없음**: `cron`으로 매일 `pg_dump` → S3 업로드가 최소선. RDS의 자동 스냅샷이 얼마나 편했는지 체감된다.
- **패치**: 보안 업데이트를 직접(`sudo apt upgrade`). 방치하면 취약점 노출.
- **모니터링**: CPU/디스크/커넥션을 직접 봐야 함(CloudWatch agent 설치 등).
- **비용 정리**: 실습 끝나면 EC2 **중지**(EBS 요금 소량 유지) 또는 **종료**(완전 삭제).
- **보안 정리**: 실습 후 RDS 마스터 비밀번호와 이 EC2의 `appuser` 비밀번호를 **로테이션**.
  5432를 `0.0.0.0/0`으로 열어 뒀다면 실습 후 규칙을 좁히거나 인스턴스를 종료할 것.

## 현업 학습 포인트

- **관리형 vs 자체 관리 트레이드오프**를 직접 비교 — "왜 다들 RDS를 쓰는가"의 답을 몸으로 얻는다.
- **`pg_hba.conf` / `listen_addresses`**: PostgreSQL 접속 제어의 기본. 클라우드 콘솔이 숨겨 주던 계층.
- **`pg_dump -Fc` + `pg_restore`**: 실무의 표준 백업·이전 도구. 버전 호환(클라이언트 ≥ 서버)에 주의.
- **DATABASE_URL 하나로 대상 전환**: 앱을 안 고치고 DB만 갈아끼우는 설정 분리(12-factor)의 실전.
- **SSL/TLS 종단**: 관리형이 대신 해 주던 전송 구간 암호화를 직접 세팅.
