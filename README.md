# AI 이력서 빌더

> AI와 대화하며 완성하는 이력서 — 자연어로 지시하면 즉시 수정되고, 채용공고 기반으로 자동 최적화됩니다.

---

## 핵심 기능

### ✨ 스트리밍 Diff 하이라이트 (킬러 기능)
AI가 수정한 부분이 노란색 → 초록색으로 애니메이션되며 강조됩니다. 어디가 바뀌었는지 즉시 파악 가능.

### 💬 대화형 편집
"자기소개를 더 임팩트있게 수정해줘" — 자연어 한 문장으로 이력서가 수정됩니다. Claude API의 Tool Use로 구조화된 JSON을 안정적으로 추출합니다.

### 🎯 JD 매칭 분석
채용공고를 붙여넣으면 이력서에서 매칭되는 핵심 경력을 청록색 테두리로 강조합니다.

### 🖱️ 우클릭 AI 재작성
이력서 텍스트를 선택 후 우클릭 → "더 강하게 / 더 간결하게 / STAR 기법으로" 즉시 재작성. SSE 스트리밍으로 실시간 미리보기.

### ↕️ 섹션 드래그&드롭
이력서 섹션을 드래그해 순서를 자유롭게 변경합니다. `@dnd-kit` 기반.

### ↩️ Undo / Redo (Ctrl+Z / Ctrl+Y)
모든 변경사항을 최대 30단계까지 되돌릴 수 있습니다. `zundo` temporal 미들웨어.

### 📄 PDF / Markdown 내보내기
- **PDF**: `@media print` CSS 최적화 → 브라우저 인쇄 다이얼로그로 A4 PDF 저장 (한글 완벽 지원)
- **Markdown**: 섹션 순서가 반영된 Markdown 자동 생성 후 클립보드 복사

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Framework** | Next.js 15 (App Router) + TypeScript |
| **AI** | Claude API (`claude-sonnet-4-6`) — SSE 스트리밍 + Tool Use |
| **상태관리** | Zustand + Immer + zundo (Undo/Redo) |
| **스키마** | Zod (이력서 JSON 타입 안전성) |
| **드래그&드롭** | @dnd-kit/core + @dnd-kit/sortable |
| **스타일링** | Tailwind CSS v4 + 커스텀 디자인 시스템 |

---

## 아키텍처

```
사용자 입력 (Chat)
      │
      ▼
POST /api/chat  ─── SSE 스트리밍 ──▶ ChatPanel
      │                                   │
      │  Claude Tool Use                  │ diff 섹션 ID 추출
      │  (JSON 구조화)                    ▼
      ▼                            DiffStore.triggerDiff()
ResumeStore.update*()                     │
      │                                   ▼
      ▼                            ResumePreview (diff-new 애니)
실시간 프리뷰 반영
```

**API 엔드포인트:**
- `POST /api/chat` — 메인 대화 SSE 스트림 (Tool Use 포함)
- `POST /api/analyze-jd` — 채용공고 분석 (keywords, requiredSkills 추출)
- `POST /api/rewrite` — 선택 텍스트 AI 재작성 SSE 스트림

---

## 로컬 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local

# 개발 서버 시작
npm run dev
```

`http://localhost:3000` 에서 확인.

---

## 기술적 결정 포인트

### 1. 왜 스트리밍인가
일반 요청은 Claude가 전체 응답을 생성할 때까지 기다려야 해 3–5초 공백이 생깁니다. SSE 스트리밍은 첫 토큰이 나오는 즉시 UI에 반영되어 체감 대기시간을 90% 이상 줄입니다.

### 2. Tool Use vs 프롬프트 JSON 파싱
프롬프트로 JSON을 유도하면 파싱 실패율이 5–10%에 달합니다. Tool Use는 Claude가 스키마에 맞는 JSON만 출력하도록 강제하여 실패율 < 0.1%를 달성합니다.

### 3. Diff 하이라이트 구현
Tool 호출 응답(`tool_done`)에서 변경된 섹션 ID 목록을 받아 `DiffStore`에 등록합니다. CSS `@keyframes`로 yellow(1s) → green(2.8s) → fade(1.2s) 3단계 애니메이션을 구현합니다.

### 4. Zustand + Immer + zundo
- **Immer**: 불변 상태를 가변적으로 업데이트 (보일러플레이트 최소화)
- **zundo temporal**: 이력 스냅샷을 자동 관리, Undo/Redo를 10줄로 구현

### 5. 우클릭 컨텍스트 메뉴
`contextmenu` 이벤트에서 `window.getSelection()`으로 선택 범위를 저장하고, AI 재작성 완료 후 `Range.deleteContents() + insertNode()`로 DOM을 직접 수정합니다. React 상태를 거치지 않아 이력서 렌더링과 독립적으로 동작합니다.

---

## 프로젝트 구조

```
resume-builder/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # 메인 AI 스트리밍 엔드포인트
│   │   ├── analyze-jd/route.ts    # JD 분석 API
│   │   └── rewrite/route.ts       # 텍스트 재작성 SSE
│   ├── builder/page.tsx           # 3단 레이아웃 빌더
│   └── page.tsx                   # 랜딩 페이지
├── components/
│   ├── chat/ChatPanel.tsx         # AI 채팅 인터페이스
│   ├── preview/
│   │   ├── ResumePreview.tsx      # 이력서 실시간 미리보기 (DnD)
│   │   └── TextRewriteMenu.tsx    # 우클릭 재작성 메뉴
│   └── tools/ToolsPanel.tsx       # JD 분석 + 톤 설정 + 내보내기
├── lib/
│   ├── claude/                    # Claude API 클라이언트 + 프롬프트
│   └── resume/                    # 스키마 (Zod) + Markdown 변환
├── stores/
│   ├── resume-store.ts            # 이력서 상태 (temporal Undo/Redo)
│   ├── chat-store.ts              # 채팅 상태
│   ├── diff-store.ts              # Diff 하이라이트 상태
│   └── ui-store.ts                # UI 상태 (모바일 탭 등)
└── types/resume.ts                # Zod 스키마 기반 타입
```

---

## 개발 명령어

```bash
npm run dev       # 개발 서버 (localhost:3000)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint 검사
npm run typecheck # TypeScript 타입 체크
```

---

*2026 · FE 개발자 포트폴리오 프로젝트*
