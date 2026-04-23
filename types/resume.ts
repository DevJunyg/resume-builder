import { z } from "zod";
import type {
  ResumeSchema,
  PersonalInfoSchema,
  BriefIntroSchema,
  CoreCompetencySchema,
  CoreCompetenciesSchema,
  ExperienceEntrySchema,
  WorkItemSchema,
  StarHighlightSchema,
  EducationSchema,
  SkillsSchema,
  SkillGroupSchema,
  ResumeSectionSchema,
  SectionTypeSchema,
  ResumeMetadataSchema,
  JdMetadataSchema,
  ToneSchema,
  CustomSectionSchema,
  CustomSectionItemSchema,
  EmploymentTypeSchema,
} from "@/lib/resume/schema";

export type Resume = z.infer<typeof ResumeSchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type BriefIntro = z.infer<typeof BriefIntroSchema>;
export type CoreCompetency = z.infer<typeof CoreCompetencySchema>;
export type CoreCompetencies = z.infer<typeof CoreCompetenciesSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type WorkItem = z.infer<typeof WorkItemSchema>;
export type StarHighlight = z.infer<typeof StarHighlightSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skills = z.infer<typeof SkillsSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type ResumeSection = z.infer<typeof ResumeSectionSchema>;
export type SectionType = z.infer<typeof SectionTypeSchema>;
export type ResumeMetadata = z.infer<typeof ResumeMetadataSchema>;
export type JdMetadata = z.infer<typeof JdMetadataSchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;
export type CustomSection = z.infer<typeof CustomSectionSchema>;
export type CustomSectionItem = z.infer<typeof CustomSectionItemSchema>;
