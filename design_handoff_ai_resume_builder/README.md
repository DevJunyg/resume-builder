# Handoff: AI 이력서 빌더 (resumé.ai)

## Overview

5년차 프론트엔드 개발자의 포트폴리오 프로젝트. 사용자가 AI와 대화하면서 이력서를 완성하는 웹 앱입니다.  
인터뷰어에게 "AI를 UX의 중심으로 설계할 줄 안다"는 것을 증명하는 것이 목적입니다.

## About the Design Files

이 폴더의 HTML 파일들은 **디자인 레퍼런스 프로토타입**입니다. 실제 프로덕션에 그대로 사용하는 코드가 아닙니다.  
개발 목표는 이 HTML 프로토타입을 기존 코드베이스(**Next.js 16 + Tailwind CSS v4 + shadcn/ui**) 환경에서 재현하는 것입니다.  
색상·타이포그래피·인터랙션·애니메이션을 최대한 충실하게 구현하되, 코드베이스의 기존 패턴과 컴포넌트를 활용하세요.

## Fidelity

**High-fidelity (hi-fi)** 목업입니다.  
색상, 타이포그래피, 간격, 인터랙션이 픽셀 수준에서 확정된 상태입니다. 개발자는 이 프로토타입을 보고 최대한 픽셀 퍼펙트에 가깝게 구현해야 합니다.

---

## Screens / Views

### 1. 랜딩 페이지 (`/`)

**목적**: 제품을 5초 안에 이해할 수 있는 랜딩. 킬러 기능(Diff 하이라이트)을 시각적으로 암시.

#### 레이아웃
- `min-height: 100vh`, `overflow-x: hidden`
- 상단 고정 네비게이션 (`height: 64px`, `backdrop-filter: blur(20px)`, `position: fixed`)
- Hero 섹션: `padding: 120px 48px 80px`, `max-width: 1280px`, `margin: 0 auto`
  - 2-column flex (좌: `flex: 0 0 520px` / 우: `flex: 1`)
- Feature 섹션: `padding: 60px 48px 100px`, 3-column CSS Grid (`grid-template-columns: repeat(3, 1fr)`, `gap: 24px`)

#### 네비게이션
- 로고 (좌) + 테마 토글 버튼 + CTA 버튼 (우)
- 배경: `rgba(8,8,14,0.7)` (dark) / `rgba(245,245,255,0.8)` (light)
- 하단 border: `1px solid var(--border)`

#### Hero 좌측 (카피)
- Badge: `"AI-Powered Resume Builder"` — accent variant (indigo bg)
- H1: `font-size: 58px`, `font-weight: 800`, `line-height: 1.08`, `letter-spacing: -0.04em`
  - 두 번째 줄: 그라디언트 텍스트 (`#6366f1 → #22d3ee`)
- 부제목: `font-size: 18px`, `line-height: 1.7`, `color: var(--text-muted)`, `max-width: 420px`
- CTA 버튼 2개 (primary "무료로 시작하기" + ghost "데모 보기"), `gap: 12px`
- 하단 캡션: `font-size: 13px`, `color: var(--text-muted)`

#### Hero 우측 (애니메이션 목업)
- 브라우저 chrome 스타일 카드 (둥근 모서리, border, 상단 traffic light dots)
- 내부: 미니 빌더 미리보기 (채팅 200px + 이력서 영역)
- **핵심 애니메이션**: 이력서 자기소개 텍스트 5.5초마다 반복
  - 0ms: 투명 배경
  - 1500ms: 노란 배경 `rgba(234,179,8,0.35)` 전환 (0.3s ease)
  - 2700ms: 초록 배경 `rgba(34,197,94,0.25)` 전환 (0.8s ease)
  - 4000ms: 투명 복귀 (1.2s ease)
  - JD 매칭 섹션 예시: `border-left: 3px solid #22d3ee` + `background: rgba(34,211,238,0.06)`

#### Feature 카드 (3개)
- 각 카드: `padding: 28px`, `border-radius: 12px`, `border: 1px solid var(--border)`
- Hover: `border-color: rgba(99,102,241,0.28)`, `background: var(--surface-2)` (0.2s ease)
- 아이콘: **TODO** `lucide-react` 아이콘으로 교체 필요
  - 카드 1: `<Zap size={20} strokeWidth={1.8} />` — "스트리밍 Diff 하이라이트"
  - 카드 2: `<Target size={20} strokeWidth={1.8} />` — "JD 매칭 분석"
  - 카드 3: `<MessageSquare size={20} strokeWidth={1.8} />` — "대화형 편집"
- 아이콘 색상: `color: var(--accent)`, `opacity: 0.85`
- 제목: `font-size: 15px`, `font-weight: 700`, `letter-spacing: -0.02em`
- 설명: `font-size: 13px`, `color: var(--text-muted)`, `line-height: 1.7`

---

### 2. 빌더 페이지 (`/builder`)

**목적**: AI와 대화하며 이력서를 실시간 수정. 3단 레이아웃.

#### 전체 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│  Header (height: 56px, border-bottom, bg: var(--surface))│
├──────────────┬──────────────────────┬────────────────────┤
│  ChatPanel   │  Resume Preview      │  ToolsPanel        │
│  width: 340px│  flex: 1            │  width: 264px      │
│  border-right│  overflowY: auto     │  border-left       │
└──────────────┴──────────────────────┴────────────────────┘
```
- 전체 height: `100vh`
- Header + 3-panel: `display: flex`, `flex-direction: column`
- 3-panel: `flex: 1`, `overflow: hidden`

#### 빌더 Header
- 좌: 뒤로가기 버튼(`<ArrowLeft />` **TODO**) + 로고 + divider + 파일명 레이블
- 우: 수정 상태 배지 + JD분석 배지 + 테마 토글
- 수정 중 배지: `background: var(--surface-2)`, `border: 1px solid var(--border)`, 녹색 dot + "수정 적용 중"
- JD 분석 배지: 같은 스타일, "JD 분석됨"

---

### 3. 채팅 패널 (`ChatPanel`)

#### 구조 (flex column, height: 100%)
1. **헤더** (`padding: 14px 20px`, border-bottom)
   - 레이블 "대화" (`font-size: 11px`, uppercase, `letter-spacing: 0.06em`)
   - 우측: 녹색 dot + "연결됨" (`font-size: 11px`)

2. **퀵 액션** (`padding: 12px 16px`, border-bottom)
   - 섹션 레이블 "제안" (11px, uppercase)
   - 버튼 3개 (flex column, `gap: 6px`):
     - `background: var(--surface-2)`, `border: 1px solid var(--border)`, `border-radius: 8px`
     - `padding: 7px 12px`, `font-size: 12px`, `color: var(--text-subtle)`
     - Hover: `border-color: rgba(99,102,241,0.4)`
   - 버튼 텍스트:
     - "자기소개를 더 임팩트있게 수정해줘"
     - "경력 기술서를 수치화해줘"
     - "JD와 매칭되는 부분 분석해줘"

3. **메시지 리스트** (`flex: 1`, `overflow-y: auto`, `padding: 16px`, `gap: 12px`)
   - **사용자 메시지**: `align-self: flex-end`, `border-radius: 14px 14px 4px 14px`
     - Background: `linear-gradient(135deg, #6366f1, #4f56e0)`, `color: #fff`
     - `box-shadow: 0 2px 12px rgba(99,102,241,0.3)`
   - **AI 메시지**: `align-self: flex-start`, `border-radius: 14px 14px 14px 4px`
     - Background: `var(--surface-2)`, border: `1px solid var(--border)`
     - 상단 레이블: "어시스턴트" (`font-size: 11px`, `font-weight: 600`)
   - **스트리밍 상태**:
     - 빈 텍스트: "AI가 생각 중" + 점 애니메이션 (3개 점이 위아래로 `translateY(-4px)` 순차 bouncing, 1.2s 루프)
     - 타이핑 중: 텍스트 끝에 `|` 커서 (`animation: blink-cursor 0.8s step-end infinite`)
   - **Markdown bold** 처리: `**텍스트**` → `<strong>텍스트</strong>`

4. **입력창** (`padding: 12px 16px`, border-top)
   - 컨테이너: `background: var(--surface-2)`, `border: 1px solid var(--border)`, `border-radius: 12px`
   - `<textarea>`: 투명 배경, 2 rows, `font-size: 13px`
   - 전송 버튼: `30×30px`, `border-radius: 8px`
     - 비활성: `background: var(--surface-3)`, `color: var(--text-muted)`
     - 활성: `background: linear-gradient(135deg, #6366f1, #22d3ee)`, `color: #fff`
     - **TODO**: `<Send size={13} />` 아이콘으로 교체
   - 안내 텍스트: "Enter로 전송 · Shift+Enter 줄바꿈" (`font-size: 11px`, centered)

#### 스켈레톤 로딩 (초기 1.4초)
- 3개 `SkeletonBlock` (60px, 40px, 80px 높이)
- `animation: skeleton-pulse 1.6s ease-in-out infinite` (opacity 0.45↔0.85)

---

### 4. 이력서 미리보기 (`ResumePreview`)

**중요**: 이력서 카드 자체는 항상 흰색 배경 (`#ffffff`). 다크/라이트 앱 테마와 무관.

#### 미리보기 영역 레이아웃
- 외부 스크롤 컨테이너: `flex: 1`, `overflow-y: auto`, `padding: 24px`, `background: var(--surface-2)`, `display: flex`, `justify-content: center`
- 이력서 카드: `max-width: 640px`, `width: 100%`, `background: #fff`, `border-radius: 12px`, `padding: 36px 40px`
- 카드 그림자: `box-shadow: 0 8px 40px rgba(0,0,0,0.18)`

#### 이력서 내부 타이포그래피
- 폰트: Plus Jakarta Sans (앱과 동일)
- 이름: `font-size: 26px`, `font-weight: 800`, `letter-spacing: -0.03em`, `color: #0d0d1a`
- 직함: `font-size: 13px`, `color: #6868a0`
- 연락처: `font-size: 12px`, `color: #4a4a6a`, flex row with `gap: 16px`
- 섹션 타이틀: `font-size: 11px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.1em`, `color: #4a4a8a`
  - `border-bottom: 1.5px solid #e8e8f4`, `padding-bottom: 6px`, `margin-bottom: 12px`
- 본문: `font-size: 13px`, `line-height: 1.75`, `color: #2d2d4a`
- 스킬 뱃지: `background: #f0f0f8`, `border: 1px solid #e0e0f0`, `border-radius: 20px`, `font-size: 12px`, `color: #4a4a8a`, `font-weight: 600`
- 기술스택 태그: `background: #f8f8fc`, `border: 1px solid #e0e0f0`, `border-radius: 6px`, `font-size: 12px`, `font-weight: 500`

#### 킬러 피처 1 — Diff 하이라이트 애니메이션

AI가 섹션을 수정하면 해당 섹션/텍스트에 단계별 배경 전환 적용:

| Phase | 시작 | 배경색 | transition |
|-------|------|--------|-----------|
| 1 (yellow) | 0ms | `rgba(234,179,8,0.3)` | `background 0.3s` |
| 2 (green) | +1000ms | `rgba(34,197,94,0.2)` | `background 0.9s` |
| 3 (clear) | +2800ms | `transparent` | `background 1.2s` |
| 제거 | +4200ms | — | state 삭제 |

```tsx
// 상태 구조 예시
type DiffState = Record<string, 1 | 2 | 3>; // sectionId → phase

// 적용 대상 ID
// - 'summary': 자기소개 paragraph
// - 'e1-1', 'e1-2', 'e1-3': 경력 기술서 각 항목 li
```

#### 킬러 피처 2 — 섹션별 스켈레톤 로딩

초기 진입 시 1.4초 동안 실제 콘텐츠 대신 스켈레톤 표시:
```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 0.85; }
}
.skeleton { animation: skeleton-pulse 1.6s ease-in-out infinite; }
```
스켈레톤 블록: `background: var(--surface-3)`, `border-radius: 6px`

#### 킬러 피처 3 — JD 매칭 하이라이트

JD 분석 후 매칭 섹션에 적용:
```css
/* 매칭된 섹션/항목 스타일 */
border-left: 3px solid #22d3ee;
padding-left: 12px;
margin-left: -15px;
background: rgba(34,211,238,0.05);
border-radius: 0 4px 4px 0;
transition: all 0.5s ease;
```
매칭 기술스택 태그:
```css
background: rgba(34,211,238,0.12);
border: 1px solid #22d3ee;
color: #0e7490;
```

매칭 대상 ID: `'exp1'` (경력 섹션), `'e1-1'`, `'e1-2'`, `'summary'`

---

### 5. 도구 패널 (`ToolsPanel`)

#### 구조 (overflow-y: auto, padding: 20px, flex column, gap: 20px)

1. **JD 입력**
   - 섹션 레이블: "JD 분석" (11px, uppercase, `var(--text-muted)`)
   - Textarea: `background: var(--surface-2)`, `border: 1px solid var(--border)`, `border-radius: 10px`, `padding: 10px 12px`, `font-size: 12px`, `rows: 5`, `resize: vertical`
   - 분석 버튼 (full width, primary variant)
     - 기본: `<Search size={13} />` + "JD 매칭 분석" — **TODO**: `<Search />` 아이콘
     - 분석 중: thinking dots 애니메이션 + "분석 중..."
     - 비활성 조건: textarea 비어있거나 분석 중

2. **Divider** (`height: 1px`, `background: var(--border)`)

3. **톤 선택** (2×2 grid, `gap: 8px`)
   - 각 카드: `padding: 10px 12px`, `border-radius: 10px`, `cursor: pointer`
   - 비선택: `background: var(--surface-2)`, `border: 1px solid var(--border)`
   - 선택됨: `background: rgba(99,102,241,0.12)`, `border: 1px solid rgba(99,102,241,0.45)`, `box-shadow: 0 0 14px rgba(99,102,241,0.2)`
   - 선택된 레이블 색상: `#818cf8`
   - 4가지 옵션: `professional / creative / academic / startup`
   - 각 카드: 레이블(`font-size: 12px`, `font-weight: 700`) + 설명(`font-size: 11px`, muted)

4. **내보내기** (flex column, gap: 8px)
   - PDF 버튼: ghost variant, `<FileDown size={13} />` **TODO**
   - Markdown 버튼: ghost variant, `<Clipboard size={13} />` **TODO**

---

## Interactions & Behavior

### 스트리밍 시뮬레이션
```ts
// 타이핑 속도: 18~30ms per 1-4글자
const streamText = (text, onUpdate) => new Promise(resolve => {
  let i = 0;
  const tick = () => {
    i = Math.min(i + Math.ceil(Math.random() * 4 + 1), text.length);
    onUpdate(text.slice(0, i));
    if (i < text.length) setTimeout(tick, 18 + Math.random() * 12);
    else resolve();
  };
  setTimeout(tick, 50);
});
```

### 채팅 → 이력서 수정 플로우
1. 사용자 메시지 추가 → 스트리밍 AI 응답 시작
2. 스트리밍 완료 후 → 이력서 데이터 업데이트 + diff phases 트리거
3. Phase 1 (yellow, 0ms) → Phase 2 (green, +1s) → Phase 3 (fade, +2.8s) → 제거 (+4.2s)

### 시나리오별 반응
| 사용자 입력 | 이력서 변경 | Diff 적용 대상 |
|------------|------------|----------------|
| "자기소개를 더 임팩트있게 수정해줘" | `summary` 텍스트 교체 | `['summary']` |
| "경력 기술서를 수치화해줘" | `exp1` items 교체 (MAU, % 수치 추가) | `['e1-1', 'e1-2', 'e1-3']` |
| "JD와 매칭되는 부분 분석해줘" | JD 매칭 Set 활성화 | `['summary', 'exp1']` |

### JD 분석 (ToolsPanel에서 직접)
1. textarea에 JD 입력 → 버튼 클릭
2. 1.8초 로딩 (analyzing 상태)
3. 완료 → JD 매칭 하이라이트 활성 + AI 채팅 메시지 자동 추가

### 페이지 전환
- 랜딩 → 빌더: "시작하기" 또는 "무료로 시작하기" 버튼 클릭 (즉시 전환)
- 빌더 → 랜딩: 헤더 뒤로가기 버튼 클릭

---

## State Management

```ts
// BuilderPage 상태
const [resume, setResume] = useState<ResumeData>(INITIAL_RESUME);
const [diffs, setDiffs] = useState<Record<string, 1|2|3>>({});
const [jdMatched, setJdMatched] = useState<Set<string>>(new Set());
const [messages, setMessages] = useState<Message[]>([initialAIMsg]);
const [isStreaming, setIsStreaming] = useState(false);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [tone, setTone] = useState<'professional'|'creative'|'academic'|'startup'>('professional');
const [skeleton, setSkeleton] = useState(true); // false after 1.4s

// App 전역 상태
const [view, setView] = useState<'landing'|'builder'>('landing'); // localStorage 'rab_view'
const [theme, setTheme] = useState<'dark'|'light'>('dark'); // localStorage 'rab_theme'
```

---

## Design Tokens

### 컬러 — Dark Theme
```css
--bg: #08080e;
--surface: #0d0d1c;
--surface-2: #13132a;
--surface-3: #1c1c3a;
--border: rgba(99,102,241,0.11);
--border-hover: rgba(99,102,241,0.38);
--text: #e2e2f0;
--text-muted: #6464a0;
--text-subtle: #9898c8;
--accent: #6366f1;
--accent-2: #22d3ee;
```

### 컬러 — Light Theme
```css
--bg: #f5f5ff;
--surface: #ffffff;
--surface-2: #f0f0fa;
--surface-3: #e6e6f4;
--border: rgba(99,102,241,0.1);
--border-hover: rgba(99,102,241,0.32);
--text: #0d0d1c;
--text-muted: #7878a8;
--text-subtle: #5050a0;
--accent: #4f46e5;
--accent-2: #0891b2;
```

### 그라디언트
```css
--gradient-accent: linear-gradient(135deg, #6366f1 0%, #22d3ee 100%);
--gradient-button: linear-gradient(135deg, #6366f1, #4f56e0);
```

### 타이포그래피
```css
font-family: 'Plus Jakarta Sans', sans-serif;
/* Scale */
11px / 12px / 13px / 14px / 15px / 16px / 18px / 26px / 36px / 58px
/* Weights: 400, 500, 600, 700, 800 */
```

### 레이아웃 & 간격
```
Panel gap: 0 (border로 구분)
Card padding: 28px (feature card), 36px 40px (resume card)
Section gap: 20px (tools panel), 12px (chat messages)
Border radius: 6 / 8 / 10 / 12 / 16 / 20px
```

### 그림자
```css
/* Primary button glow */
box-shadow: 0 0 16px rgba(99,102,241,0.3); /* hover: 28px, 0.55 */
/* Resume card */
box-shadow: 0 8px 40px rgba(0,0,0,0.18);
/* Chat user bubble */
box-shadow: 0 2px 12px rgba(99,102,241,0.3);
```

---

## TODO: Lucide React 아이콘 교체

프로토타입에서 아이콘 placeholder를 사용한 위치입니다. 실제 구현 시 `lucide-react`로 교체하세요.

```tsx
import { Sun, Moon, FileText, ArrowLeft, Send, Zap, Target,
         MessageSquare, Search, FileDown, Clipboard } from 'lucide-react';
```

| 위치 | 현재 placeholder | 교체할 아이콘 |
|------|-----------------|--------------|
| ThemeToggle (dark) | `☀` 텍스트 | `<Sun size={14} />` |
| ThemeToggle (light) | `☽` 텍스트 | `<Moon size={14} />` |
| Logo 내부 | `≡` 텍스트 | `<FileText size={13} strokeWidth={2.5} />` |
| 빌더 뒤로가기 버튼 | `←` 텍스트 | `<ArrowLeft size={16} strokeWidth={2} />` |
| 채팅 전송 버튼 | `↑` 텍스트 | `<Send size={13} strokeWidth={2} />` |
| JD 분석 버튼 | 텍스트만 | `<Search size={13} strokeWidth={2} />` |
| PDF 내보내기 | 텍스트만 | `<FileDown size={13} strokeWidth={2} />` |
| Markdown 내보내기 | 텍스트만 | `<Clipboard size={13} strokeWidth={2} />` |
| Feature 카드 1 | 회색 블록 | `<Zap size={20} strokeWidth={1.8} />` |
| Feature 카드 2 | 회색 블록 | `<Target size={20} strokeWidth={1.8} />` |
| Feature 카드 3 | 회색 블록 | `<MessageSquare size={20} strokeWidth={1.8} />` |

---

## Files

```
design_handoff_ai_resume_builder/
├── README.md                     ← 이 파일
├── AI Resume Builder.html        ← 메인 프로토타입 (랜딩 + 빌더 통합)
├── js/
│   ├── data.jsx                  ← 이력서 샘플 데이터, AI 시나리오 스크립트
│   ├── SharedComponents.jsx      ← 공용 컴포넌트 (GlowButton, Badge, Logo 등)
│   ├── LandingPage.jsx           ← 랜딩 페이지 컴포넌트
│   └── BuilderPage.jsx           ← 빌더 페이지 (ChatPanel, ResumePreview, ToolsPanel)
```

### 주의사항
- `js/*.jsx` 파일들은 Babel standalone으로 transpile됩니다. 실제 Next.js 환경에서는 직접 import 가능합니다.
- `window.LucideReact` 참조는 프로토타입 전용입니다. 실제 구현 시 위 TODO 표를 참고해 교체하세요.
- `localStorage` 키: `rab_view` (현재 화면), `rab_theme` (테마)
- 이력서 데이터는 `js/data.jsx`의 `RESUME_DATA`를 참고하세요.
