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

// ─── STAR 기법 성과 항목 ──────────────────────────────────────────────────────
// 사용자 입력 → AI가 STAR로 재구성 → formatted 사용

export const StarHighlightSchema = z.object({
  id: z.string(),
  raw: z.string(),        // 사용자가 입력한 원본
  formatted: z.string(),  // AI가 STAR 기법으로 재구성한 최종 문장
  situation: z.string().optional(),
  task: z.string().optional(),
  action: z.string().optional(),
  result: z.string().optional(),
  isJdHighlighted: z.boolean().default(false),
});

// ─── 경력 ─────────────────────────────────────────────────────────────────────

export const ExperienceEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  startDate: z.string(), // "YYYY-MM"
  endDate: z.string().nullable(), // null = 현재 재직 중
  highlights: z.array(StarHighlightSchema).default([]),
  isJdHighlighted: z.boolean().default(false),
});

// ─── 프로젝트 ─────────────────────────────────────────────────────────────────

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  highlights: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  url: z.string().url().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  isJdHighlighted: z.boolean().default(false),
});

// ─── 학력 ─────────────────────────────────────────────────────────────────────

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  gpa: z.string().optional(),
  achievements: z.array(z.string()).default([]),
});

// ─── 스킬 ─────────────────────────────────────────────────────────────────────

export const SkillGroupSchema = z.object({
  category: z.string(), // 예: "Frontend", "Backend"
  items: z.array(z.string()),
});

export const SkillsSchema = z.object({
  technical: z.array(SkillGroupSchema).default([]),
  languages: z.array(z.string()).optional(), // 어학 능력
  certifications: z.array(z.string()).optional(),
});

// ─── 커스텀 섹션 (자격증, 수상 등) ──────────────────────────────────────────────

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
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "custom",
]);

export const ResumeSectionSchema = z.object({
  id: z.string(),
  type: SectionTypeSchema,
  title: z.string(), // 사용자가 변경 가능한 섹션 제목
  isVisible: z.boolean().default(true),
  order: z.number().int(),
  customSectionId: z.string().optional(), // type === "custom"일 때 연결 ID
});

// ─── JD 분석 메타데이터 ──────────────────────────────────────────────────────

export const JdMetadataSchema = z.object({
  rawText: z.string(),
  keywords: z.array(z.string()).default([]),    // 추출된 핵심 키워드
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  analyzedAt: z.string(),                         // ISO 날짜
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

// ─── 이력서 요약 (AI 생성) ─────────────────────────────────────────────────────

export const ResumeSummarySchema = z.object({
  text: z.string(),
  isAiGenerated: z.boolean().default(false),
});

// ─── 최상위 이력서 스키마 ──────────────────────────────────────────────────────

export const ResumeSchema = z.object({
  id: z.string(),
  personalInfo: PersonalInfoSchema,
  summary: ResumeSummarySchema.optional(),
  sections: z.array(ResumeSectionSchema), // 드래그 앤 드롭 순서
  experience: z.array(ExperienceEntrySchema).default([]),
  projects: z.array(ProjectSchema).default([]),
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
    personalInfo: {
      name: "",
      email: "",
    },
    summary: undefined,
    sections: [
      { id: "s-personal", type: "personalInfo", title: "기본 정보", isVisible: true, order: 0 },
      { id: "s-summary", type: "summary", title: "자기소개", isVisible: true, order: 1 },
      { id: "s-experience", type: "experience", title: "경력", isVisible: true, order: 2 },
      { id: "s-projects", type: "projects", title: "프로젝트", isVisible: true, order: 3 },
      { id: "s-education", type: "education", title: "학력", isVisible: true, order: 4 },
      { id: "s-skills", type: "skills", title: "기술 스택", isVisible: true, order: 5 },
    ],
    experience: [],
    projects: [],
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
