import type Anthropic from "@anthropic-ai/sdk";

// 이력서 업데이트에 사용하는 Claude Tool 목록
export const RESUME_TOOLS: Anthropic.Tool[] = [
  {
    name: "update_brief_intro",
    description:
      "이력서의 간략 소개(자기소개)를 업데이트합니다. 사용자가 자기소개 수정을 요청하거나 더 나은 버전을 제안할 때 호출합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        text: {
          type: "string",
          description: "새로운 간략 소개 텍스트 (완성된 문장)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "update_personal_info",
    description:
      "이력서의 기본 정보(이름, 이메일, 전화번호, 위치)를 업데이트합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
      },
    },
  },
  {
    name: "update_core_competencies",
    description:
      "이력서의 핵심역량 목록을 업데이트합니다. 대화에서 사용자의 강점이나 기술이 파악될 때 호출합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "고유 ID (nanoid 형식)" },
              title: {
                type: "string",
                description: "역량명 (예: AI 기반 UX 설계)",
              },
              description: { type: "string", description: "부연 설명 (선택)" },
            },
            required: ["id", "title"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "add_experience",
    description:
      "이력서에 새로운 경력을 추가합니다. 사용자가 새 직장/프로젝트 경험을 이야기할 때 호출합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "고유 ID" },
        company: { type: "string" },
        role: { type: "string", description: "직책/역할" },
        department: { type: "string" },
        location: { type: "string" },
        startDate: { type: "string", description: "YYYY-MM 형식" },
        endDate: {
          type: "string",
          description:
            "YYYY-MM 형식. 현재 재직 중이면 이 필드를 아예 생략하세요 (문자열 \"null\"을 넣지 마세요)",
        },
        employmentType: {
          type: "string",
          enum: ["정규직", "계약직", "인턴", "프리랜서", "창업"],
        },
      },
      required: ["id", "company", "role", "startDate"],
    },
  },
  {
    name: "update_experience_highlights",
    description:
      "특정 경력의 업무 하이라이트를 STAR 기법으로 업데이트합니다. 사용자가 경력 기술서 수정을 요청하거나 성과를 수치화할 때 호출합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        experienceId: { type: "string", description: "업데이트할 경력 ID" },
        workItemId: {
          type: "string",
          description: "업데이트할 work item ID (없으면 첫 번째 항목)",
        },
        highlights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              raw: { type: "string", description: "원본 텍스트" },
              formatted: {
                type: "string",
                description: "STAR 기법 재구성 문장",
              },
              situation: { type: "string" },
              task: { type: "string" },
              action: { type: "string" },
              result: { type: "string" },
            },
            required: ["id", "raw", "formatted"],
          },
        },
      },
      required: ["experienceId", "highlights"],
    },
  },
  {
    name: "update_skills",
    description:
      "이력서의 기술 스택을 업데이트합니다. 카테고리별 기술 스킬과 어학, 자격증을 포함합니다. 사용자가 보유 기술/스킬/자격증을 알려줄 때 호출합니다. (전체를 한 번에 전달 — 부분 갱신이 아니라 덮어씀)",
    input_schema: {
      type: "object" as const,
      properties: {
        technical: {
          type: "array",
          description: "카테고리별 기술 스킬 목록",
          items: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "카테고리 (예: Frontend, Backend, DevOps). 분류가 애매하면 '기술' 하나로 묶어도 됨",
              },
              items: {
                type: "array",
                items: { type: "string" },
                description: "해당 카테고리의 기술 목록",
              },
            },
            required: ["category", "items"],
          },
        },
        languages: {
          type: "array",
          items: { type: "string" },
          description: "어학 능력 (선택)",
        },
        certifications: {
          type: "array",
          items: { type: "string" },
          description: "자격증 목록 (선택). 예: 정보처리기사, 무선설비기사",
        },
      },
      required: ["technical"],
    },
  },
  {
    name: "add_education",
    description:
      "이력서에 학력을 추가합니다. 같은 학교+입학시기면 덮어씁니다(중복 방지).",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "고유 ID" },
        institution: { type: "string", description: "학교명" },
        degree: { type: "string", description: "학위 (예: 학사, 석사, 박사)" },
        field: { type: "string", description: "전공" },
        startDate: { type: "string", description: "YYYY 또는 YYYY-MM 형식" },
        endDate: {
          type: "string",
          description:
            "YYYY 또는 YYYY-MM 형식. 재학 중이면 이 필드를 생략하세요 (문자열 \"null\" 금지)",
        },
        gpa: { type: "string", description: "학점 (선택, 예: 3.8/4.5)" },
        achievements: {
          type: "array",
          items: { type: "string" },
          description: "주요 성과/수상 (선택)",
        },
      },
      required: ["id", "institution", "degree", "field", "startDate"],
    },
  },
  {
    name: "update_experience",
    description:
      "기존 경력의 기본 정보(회사명/직책/부서/기간 등)를 수정합니다. 시스템 프롬프트에 제공된 현재 이력서 상태의 실제 experienceId를 사용하세요 (ID를 지어내지 마세요). 수정할 필드만 전달하면 됩니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        experienceId: { type: "string", description: "수정할 경력의 실제 ID" },
        company: { type: "string" },
        role: { type: "string" },
        department: { type: "string" },
        location: { type: "string" },
        startDate: { type: "string", description: "YYYY-MM 형식" },
        endDate: {
          type: "string",
          description:
            "YYYY-MM 형식. 재직 중으로 바꾸려면 값에 \"현재\"를 전달 (문자열 \"null\" 금지)",
        },
        employmentType: {
          type: "string",
          enum: ["정규직", "계약직", "인턴", "프리랜서", "창업"],
        },
      },
      required: ["experienceId"],
    },
  },
  {
    name: "delete_experience",
    description:
      "이력서에서 경력 하나를 삭제합니다. 사용자가 특정 경력의 삭제를 요청할 때 호출하세요. 현재 이력서 상태의 실제 experienceId를 사용하세요.",
    input_schema: {
      type: "object" as const,
      properties: {
        experienceId: { type: "string", description: "삭제할 경력의 실제 ID" },
      },
      required: ["experienceId"],
    },
  },
  {
    name: "delete_education",
    description:
      "이력서에서 학력 하나를 삭제합니다. 현재 이력서 상태의 실제 educationId를 사용하세요.",
    input_schema: {
      type: "object" as const,
      properties: {
        educationId: { type: "string", description: "삭제할 학력의 실제 ID" },
      },
      required: ["educationId"],
    },
  },
  {
    name: "clear_resume",
    description:
      "이력서 전체를 빈 상태로 초기화합니다. 되돌리기 어려운 작업이므로 사용자가 '초기화', '전부 지워줘', '처음부터 다시' 등 명시적으로 요청한 경우에만 호출하세요. 호출 전에 반드시 사용자에게 한 번 확인하세요.",
    input_schema: {
      type: "object" as const,
      properties: {
        confirm: {
          type: "boolean",
          description: "사용자가 초기화를 확인했으면 true",
        },
      },
      required: ["confirm"],
    },
  },
];

// Tool 이름 → 업데이트 대상 섹션 ID 매핑 (Diff 하이라이트용)
export const TOOL_SECTION_MAP: Record<string, string[]> = {
  update_brief_intro: ["brief-intro"],
  update_personal_info: ["personal-info"],
  update_core_competencies: ["core-competencies"],
  add_experience: ["experience"],
  update_experience_highlights: ["experience"],
  update_skills: ["skills"],
  add_education: ["education"],
  update_experience: ["experience"],
  delete_experience: ["experience"],
  delete_education: ["education"],
  clear_resume: [
    "personal-info",
    "brief-intro",
    "core-competencies",
    "experience",
    "education",
    "skills",
  ],
};
