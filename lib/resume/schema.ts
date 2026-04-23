import { z } from "zod";

// ─── 기본 정보 ────────────────────────────────────────────────────────────────

export const PersonalInfoSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
});

// ─── 간략 소개 ────────────────────────────────────────────────────────────────

export const BriefIntroSchema = z.object({
  text: z.string(),
  isAiGenerated: z.boolean().default(false),
});

// ─── 핵심역량 ─────────────────────────────────────────────────────────────────

export const CoreCompetencySchema = z.object({
  id: z.string(),
  title: z.string(),             // 예: "AI 기반 UX 설계"
  description: z.string().optional(), // 부연 설명
});

export const CoreCompetenciesSchema = z.object({
  items: z.array(CoreCompetencySchema).default([]),
});

// ─── STAR 기법 성과 항목 ──────────────────────────────────────────────────────
// 사용자 입력(raw) → AI가 STAR로 재구성(formatted)

export const StarHighlightSchema = z.object({
  id: z.string(),
  raw: z.string(),        // 사용자가 입력한 원본 (Undo 복원용)
  formatted: z.string(),  // AI가 STAR 기법으로 재구성한 최종 문장
  situation: z.string().optional(),
  task: z.string().optional(),
  action: z.string().optional(),
  result: z.string().optional(),
  isJdHighlighted: z.boolean().default(false),
});

// ─── 경력기술서 항목 (각 경력에서 수행한 업무/과제) ────────────────────────────────

export const WorkItemSchema = z.object({
  id: z.string(),
  title: z.string(),                    // 업무/과제명
  startDate: z.string().optional(),     // 해당 업무 기간 시작 "YYYY-MM"
  endDate: z.string().nullable().optional(), // 해당 업무 기간 종료 (null = 진행 중)
  teamSize: z.string().optional(),      // 예: "5인 팀", "단독"
  role: z.string().optional(),          // 본인 역할 (예: "FE 리드", "단독 개발")
  description: z.string(),             // 업무 개요
  highlights: z.array(StarHighlightSchema).default([]), // STAR 기법 성과
  techStack: z.array(z.string()).default([]),
  isJdHighlighted: z.boolean().default(false),
});

// ─── 경력 ─────────────────────────────────────────────────────────────────────

export const EmploymentTypeSchema = z.enum([
  "정규직",
  "계약직",
  "인턴",
  "프리랜서",
  "창업",
]);

export const ExperienceEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),                     // 직책 (예: "시니어 프론트엔드 개발자")
  department: z.string().optional(),    // 부서
  location: z.string().optional(),
  employmentType: EmploymentTypeSchema.optional(),
  startDate: z.string(),               // 재직 시작 "YYYY-MM"
  endDate: z.string().nullable(),      // 재직 종료 (null = 현재 재직 중)
  workItems: z.array(WorkItemSchema).default([]), // 경력기술서
  isJdHighlighted: z.boolean().default(false),
});

// ─── 학력 ─────────────────────────────────────────────────────────────────────

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),       // 예: "학사", "석사"
  field: z.string(),        // 전공
  startDate: z.string(),
  endDate: z.string().nullable(),
  gpa: z.string().optional(),
  achievements: z.array(z.string()).default([]),
});

// ─── 스킬 ─────────────────────────────────────────────────────────────────────

export const SkillGroupSchema = z.object({
  category: z.string(), // 예: "Frontend", "Backend", "DevOps"
  items: z.array(z.string()),
});

export const SkillsSchema = z.object({
  technical: z.array(SkillGroupSchema).default([]),
  languages: z.array(z.string()).optional(), // 어학 능력
  certifications: z.array(z.string()).optional(),
});

// ─── 커스텀 섹션 (수상, 자격증, 발표 등) ─────────────────────────────────────────

export const CustomSectionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
});

export const CustomSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(CustomSectionItemSchema).default([]),
});

// ─── 섹션 순서 제어 (드래그 앤 드롭) ─────────────────────────────────────────────

export const SectionTypeSchema = z.enum([
  "personalInfo",
  "briefIntro",
  "coreCompetencies",
  "experience",
  "education",
  "skills",
  "custom",
]);

export const ResumeSectionSchema = z.object({
  id: z.string(),
  type: SectionTypeSchema,
  title: z.string(),              // 사용자가 변경 가능한 섹션 제목
  isVisible: z.boolean().default(true),
  order: z.number().int(),
  customSectionId: z.string().optional(), // type === "custom"일 때 연결 ID
});

// ─── JD 분석 메타데이터 ──────────────────────────────────────────────────────

export const JdMetadataSchema = z.object({
  rawText: z.string(),
  keywords: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  analyzedAt: z.string(), // ISO 날짜
});

// ─── 이력서 메타데이터 ────────────────────────────────────────────────────────

export const ToneSchema = z.enum([
  "professional",
  "creative",
  "academic",
  "startup",
]);

export const ResumeMetadataSchema = z.object({
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  jd: JdMetadataSchema.optional(),
  tone: ToneSchema.default("professional"),
  language: z.enum(["ko", "en"]).default("ko"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── 최상위 이력서 스키마 ──────────────────────────────────────────────────────

export const ResumeSchema = z.object({
  id: z.string(),
  personalInfo: PersonalInfoSchema,
  briefIntro: BriefIntroSchema.optional(),
  coreCompetencies: CoreCompetenciesSchema.optional(),
  sections: z.array(ResumeSectionSchema), // 드래그 순서
  experience: z.array(ExperienceEntrySchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: SkillsSchema,
  customSections: z.array(CustomSectionSchema).default([]),
  metadata: ResumeMetadataSchema,
});

// ─── 빈 이력서 초기값 생성 ────────────────────────────────────────────────────

export function createEmptyResume(id: string): z.infer<typeof ResumeSchema> {
  const now = new Date().toISOString();
  return {
    id,
    personalInfo: { name: "", email: "" },
    briefIntro: undefined,
    coreCompetencies: undefined,
    sections: [
      { id: "s-personal", type: "personalInfo", title: "기본 정보", isVisible: true, order: 0 },
      { id: "s-intro", type: "briefIntro", title: "간략 소개", isVisible: true, order: 1 },
      { id: "s-competencies", type: "coreCompetencies", title: "핵심역량", isVisible: true, order: 2 },
      { id: "s-experience", type: "experience", title: "경력", isVisible: true, order: 3 },
      { id: "s-education", type: "education", title: "학력", isVisible: true, order: 4 },
      { id: "s-skills", type: "skills", title: "기술 스택", isVisible: true, order: 5 },
    ],
    experience: [],
    education: [],
    skills: { technical: [] },
    customSections: [],
    metadata: {
      tone: "professional",
      language: "ko",
      createdAt: now,
      updatedAt: now,
    },
  };
}
