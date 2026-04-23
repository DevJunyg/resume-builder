import { z } from "zod";
import type {
  ResumeSchema,
  PersonalInfoSchema,
  ExperienceEntrySchema,
  StarHighlightSchema,
  ProjectSchema,
  EducationSchema,
  SkillsSchema,
  SkillGroupSchema,
  ResumeSectionSchema,
  SectionTypeSchema,
  ResumeMetadataSchema,
  ResumeSummarySchema,
  JdMetadataSchema,
  ToneSchema,
  CustomSectionSchema,
  CustomSectionItemSchema,
} from "@/lib/resume/schema";

export type Resume = z.infer<typeof ResumeSchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type StarHighlight = z.infer<typeof StarHighlightSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skills = z.infer<typeof SkillsSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type ResumeSection = z.infer<typeof ResumeSectionSchema>;
export type SectionType = z.infer<typeof SectionTypeSchema>;
export type ResumeMetadata = z.infer<typeof ResumeMetadataSchema>;
export type ResumeSummary = z.infer<typeof ResumeSummarySchema>;
export type JdMetadata = z.infer<typeof JdMetadataSchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type CustomSection = z.infer<typeof CustomSectionSchema>;
export type CustomSectionItem = z.infer<typeof CustomSectionItemSchema>;
