
const RESUME_DATA = {
  name: '김지현',
  title: '시니어 프론트엔드 엔지니어',
  email: 'jihyun@email.com',
  phone: '010-1234-5678',
  github: 'github.com/jihyunkim-dev',
  linkedin: 'linkedin.com/in/jihyunkim',
  summary: 'React와 TypeScript를 주력으로 하는 프론트엔드 개발자입니다. 5년간 스타트업과 중견 기업에서 다양한 프로젝트를 경험했으며, 사용자 중심의 인터페이스 개발에 집중해왔습니다.',
  skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Node.js', 'AWS', 'Docker'],
  experience: [
    {
      id: 'exp1',
      company: '(주)테크스타트',
      role: '시니어 프론트엔드 개발자',
      period: '2022.01 – 현재',
      items: [
        { id: 'e1-1', text: 'React 기반 SaaS 대시보드 설계 및 개발' },
        { id: 'e1-2', text: '성능 최적화 작업 진행, LCP 개선' },
        { id: 'e1-3', text: '디자인 시스템 구축 및 컴포넌트 라이브러리 배포' },
      ]
    },
    {
      id: 'exp2',
      company: '(주)디지털웍스',
      role: '프론트엔드 개발자',
      period: '2019.03 – 2021.12',
      items: [
        { id: 'e2-1', text: 'Vue.js 기반 이커머스 플랫폼 개발' },
        { id: 'e2-2', text: 'REST API 연동 및 상태관리 구현' },
        { id: 'e2-3', text: '크로스브라우저 대응 및 웹 접근성 개선' },
      ]
    }
  ],
  education: { school: '한국대학교', degree: '컴퓨터공학 학사', period: '2015.03 – 2019.02' },
  techStack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'GitHub Actions'],
};

const UPDATED_SUMMARY = '5년 경력의 프론트엔드 엔지니어. React/TypeScript 기반의 복잡한 SaaS 제품을 처음부터 끝까지 주도하며, 성능 최적화(LCP 65% 개선)와 디자인 시스템 구축으로 팀 생산성을 2배 향상시킨 경험이 있습니다. AI 중심 UX 설계와 개발자 경험 개선에 깊은 관심을 갖고 있습니다.';

const UPDATED_EXP1 = [
  { id: 'e1-1', text: 'React + TypeScript 기반 멀티테넌트 SaaS 대시보드 설계·개발 (MAU 12만)' },
  { id: 'e1-2', text: 'Lighthouse 최적화로 LCP 3.2s → 1.1s (65%) 단축, 전환율 18% 개선' },
  { id: 'e1-3', text: '60+ 컴포넌트 디자인 시스템 구축, 팀 개발 속도 2배 향상 (Storybook 운영)' },
];

const AI_SCENARIOS = [
  {
    id: 'summary',
    prompt: '자기소개를 더 임팩트있게 수정해줘',
    response: '자기소개를 업데이트했어요! 단순 기술 스택 나열 대신, **구체적인 수치**와 **비즈니스 임팩트**를 전면에 강조했습니다. 채용 담당자가 5초 안에 "이 사람의 가치"를 파악할 수 있는 구조로 작성했어요.',
    diffIds: ['summary'],
    type: 'summary',
  },
  {
    id: 'quantify',
    prompt: '경력 기술서를 수치화해줘',
    response: '경력 기술서에 **구체적인 숫자**를 추가했습니다. MAU, 성능 수치, 컴포넌트 개수 등으로 임팩트를 정량화하면 서류 통과율이 크게 높아져요. 특히 "LCP 65% 개선"은 강력한 어필 포인트가 될 거예요.',
    diffIds: ['e1-1', 'e1-2', 'e1-3'],
    type: 'exp',
  },
  {
    id: 'jd',
    prompt: 'JD와 매칭되는 부분 분석해줘',
    response: 'JD 분석 완료! **React/TypeScript 경험**, **SaaS 개발 이력**, **성능 최적화 역량**이 강하게 매칭됩니다. 파란색으로 강조된 부분들이 핵심 어필 포인트예요. 이 섹션들을 더 구체적으로 확장하면 서류 통과 확률이 높아집니다.',
    diffIds: [],
    type: 'jd',
  },
];

const JD_MATCHED = new Set(['exp1', 'e1-1', 'e1-2', 'summary']);

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

Object.assign(window, { RESUME_DATA, UPDATED_SUMMARY, UPDATED_EXP1, AI_SCENARIOS, JD_MATCHED, streamText });
