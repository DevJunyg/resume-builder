# claude-agent-team

Reusable Claude Code multi-agent teams for AI-powered development and economic analysis.

`agents/` 폴더를 `~/.claude/agents/`에 복사하면 모든 프로젝트에서 사용 가능합니다.

---

## Team 1: 개발팀 (Development Team)

| 에이전트 | 역할 | 언제 사용하나 |
|---------|------|------------|
| `orchestrator` | 팀 리드 / 유저 창구 | 항상 여기서 시작. 유저 의도 파악 후 팀에 위임 |
| `planner` | 리서치 & 전략 | 시장조사, 경쟁사 분석, 유저 스토리, 기능 정의 |
| `pm` | 프로젝트 매니저 | 스프린트 계획, 우선순위, 의존성 관리 |
| `designer` | UI/UX 디자이너 | 화면 설계, Figma 해석, 컴포넌트 스펙, 접근성 |
| `fe-dev` | 프론트엔드 개발자 | React/Next.js 컴포넌트, 페이지, 스타일링 |
| `be-dev` | 백엔드 개발자 | API 라우트, Claude API 연동, 서버 로직 |
| `qa` | QA 엔지니어 | 코드 리뷰, 테스트 작성, 버그 검출 |

## Team 2: 경제 분석팀 (Economic Analyst Team)

| 에이전트 | 역할 | 언제 사용하나 |
|---------|------|------------|
| `econ-orchestrator` | 분석팀 리드 / 유저 창구 | 경제 분석 요청 시 여기서 시작. 분석 위임 및 결과 종합 |
| `market-researcher` | 매크로 경제 리서처 | 거시경제 지표, 금리/환율/원자재, 글로벌 이벤트 분석 |
| `stock-analyst` | 주식 분석가 | 개별 종목 기본적/기술적 분석, 재무제표, 밸류에이션 |
| `crypto-analyst` | 암호화폐 분석가 | 온체인 데이터, 토큰이코노믹스, DeFi 프로토콜 분석 |
| `quant-analyst` | 퀀트 분석가 | 통계 모델링, 백테스팅, 기술적 지표 계산, 상관관계 분석 |
| `risk-manager` | 리스크 매니저 | 포트폴리오 리스크 평가, 포지션 사이징, 헷지 전략 |
| `report-writer` | 리포트 작성자 | 투자 보고서, 일일/주간 브리핑, 분석 메모 작성 |

---

## 설치

```bash
git clone https://github.com/DevJunyg/claude-agent-team.git
cp -r claude-agent-team/agents/* ~/.claude/agents/
```

## 사용법

### 개발팀
Claude Code를 시작하면 `orchestrator` 에이전트가 자동으로 팀을 조율합니다.

```
orchestrator를 사용해서 새 AI 프로젝트를 시작해줘.
be-dev를 사용해서 파일 업로드 API를 만들어줘.
qa를 사용해서 이 코드 리뷰해줘.
designer를 사용해서 이 Figma 디자인 구현 스펙 뽑아줘.
```

### 경제 분석팀
`econ-orchestrator` 에이전트로 경제 분석을 시작합니다.

```
econ-orchestrator를 사용해서 삼성전자 종합 분석해줘.
econ-orchestrator를 사용해서 비트코인 시장 전망 분석해줘.
econ-orchestrator를 사용해서 내 포트폴리오 리스크 평가해줘.
```

각 분석가를 직접 호출할 수도 있습니다:

```
stock-analyst를 사용해서 NVIDIA 재무제표 분석해줘.
crypto-analyst를 사용해서 이더리움 온체인 데이터 분석해줘.
quant-analyst를 사용해서 S&P500 백테스팅 해줘.
risk-manager를 사용해서 포트폴리오 리스크 점검해줘.
```

## 기술 스택 (개발팀 기본값, 프로젝트마다 조정 가능)

- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Claude API (claude-sonnet-4-6) with streaming
- **Design**: Figma → Tailwind

## License

MIT
