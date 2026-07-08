# syntax=docker/dockerfile:1

# ─── deps: 의존성만 먼저 설치 (레이어 캐시 최적화) ───
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── builder: 프로덕션 빌드 → .next/standalone 산출 ───
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── runner: 실행에 필요한 파일만 담은 최소 이미지 ───
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 보안: 비루트 사용자로 실행
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# standalone 서버 + 정적 자산 + public 만 복사 (dev 의존성 제외)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# next.config.ts 의 output:"standalone" 이 생성하는 진입점
CMD ["node", "server.js"]
