# CLAUDE.md

Claude Code가 이 프로젝트에서 작업할 때 따르는 규칙과 컨벤션입니다.

## 언어

- 유저와의 대화는 **한국어**로
- 코드, 변수명은 **영어**로
- 주석은 **한국어**로

## 에이전트 팀

이 레포에는 두 개의 멀티에이전트 팀이 정의되어 있습니다. (`.claude/agents/`)

### 개발팀
- 항상 `orchestrator`에서 시작
- 유저 요구사항 확정 전에 코드 작성 금지
- 스택 결정 순서: orchestrator → pm → be-dev/fe-dev 협의 → 구현

### 경제 분석팀
- 항상 `econ-orchestrator`에서 시작
- 분석 결과는 반드시 `report-writer`가 최종 정리

## 기본 기술 스택

새 프로젝트 시작 시 아래를 기본값으로 사용하되, 요구사항에 따라 조정 가능합니다.

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Claude API (`claude-sonnet-4-6`), 스트리밍 기본
- **Package manager**: npm

## 코드 규칙

- 함수형 컴포넌트, named export만 사용
- `any` 타입 사용 금지
- 환경변수로 시크릿 관리 (`.env.local`, 절대 커밋 금지)
- `.env` 파일 수정은 유저 승인 후 허용
- AI 응답은 항상 스트리밍으로 처리
- 에러는 구조화된 형태로 반환: `{ error: 'ERROR_CODE', message: '...' }`

## 자주 쓰는 명령어

```bash
npm run dev       # 개발 서버 시작
npm run build     # 프로덕션 빌드
npm run lint      # ESLint 검사
npm run typecheck # TypeScript 타입 체크
```

## 절대 하지 않는 것

- 유저 승인 없이 main 브랜치에 직접 push
- `.env` 파일 커밋 (수정은 유저 승인 후 가능)
- `any` 타입 사용
- 유저 승인 없이 외부 서비스에 데이터 전송
