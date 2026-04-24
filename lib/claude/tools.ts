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
          description: "YYYY-MM 형식. 현재 재직 중이면 null 문자열 전달",
          nullable: true,
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
];

// Tool 이름 → 업데이트 대상 섹션 ID 매핑 (Diff 하이라이트용)
export const TOOL_SECTION_MAP: Record<string, string[]> = {
  update_brief_intro: ["brief-intro"],
  update_personal_info: ["personal-info"],
  update_core_competencies: ["core-competencies"],
  add_experience: ["experience"],
  update_experience_highlights: ["experience"],
};
