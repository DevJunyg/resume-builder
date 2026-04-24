import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { createEmptyResume } from "@/lib/resume/schema";
import type { Resume, Tone, JdMetadata, CoreCompetency, ExperienceEntry, StarHighlight, EmploymentType } from "@/types/resume";

// addExperience 입력 타입 (workItems 없이 기본 필드만)
interface AddExperienceInput {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  department?: string;
  location?: string;
  employmentType?: EmploymentType;
}

interface ResumeState {
  resume: Resume;
  isDirty: boolean;
  setResume: (resume: Resume) => void;
  updatePersonalInfo: (info: Partial<Resume["personalInfo"]>) => void;
  updateBriefIntro: (text: string, isAiGenerated?: boolean) => void;
  updateTone: (tone: Tone) => void;
  updateJd: (rawText: string) => void;
  updateJdMetadata: (jd: JdMetadata) => void;
  updateCoreCompetencies: (items: Array<CoreCompetency>) => void;
  addExperience: (entry: AddExperienceInput) => void;
  updateExperienceHighlights: (experienceId: string, highlights: Array<StarHighlight>) => void;
  markClean: () => void;
}

export const useResumeStore = create<ResumeState>()(
  devtools(
    immer((set) => ({
      resume: createEmptyResume("default"),
      isDirty: false,
      setResume: (resume) =>
        set((state) => {
          state.resume = resume;
          state.isDirty = true;
        }),
      updatePersonalInfo: (info) =>
        set((state) => {
          Object.assign(state.resume.personalInfo, info);
          state.isDirty = true;
        }),
      updateBriefIntro: (text, isAiGenerated = false) =>
        set((state) => {
          state.resume.briefIntro = { text, isAiGenerated };
          state.isDirty = true;
        }),
      updateTone: (tone) =>
        set((state) => {
          state.resume.metadata.tone = tone;
          state.isDirty = true;
        }),
      updateJd: (rawText) =>
        set((state) => {
          state.resume.metadata.jd = {
            rawText,
            keywords: [],
            requiredSkills: [],
            preferredSkills: [],
            analyzedAt: new Date().toISOString(),
          };
          state.isDirty = true;
        }),
      updateJdMetadata: (jd) =>
        set((state) => {
          state.resume.metadata.jd = jd;
          state.isDirty = true;
        }),
      updateCoreCompetencies: (items) =>
        set((state) => {
          state.resume.coreCompetencies = { items };
          state.isDirty = true;
        }),
      addExperience: (entry) =>
        set((state) => {
          // 최신 경력이 앞에 오도록 배열 맨 앞에 추가
          const newEntry: ExperienceEntry = {
            ...entry,
            workItems: [],
            isJdHighlighted: false,
          };
          state.resume.experience.unshift(newEntry);
          state.isDirty = true;
        }),
      updateExperienceHighlights: (experienceId, highlights) =>
        set((state) => {
          const exp = state.resume.experience.find((e) => e.id === experienceId);
          if (!exp) return;

          if (exp.workItems.length === 0) {
            // workItem이 없으면 신규 생성 후 highlights 추가
            exp.workItems.push({
              id: `wi-${Date.now()}`,
              title: "주요 업무 및 성과",
              description: "",
              highlights,
              techStack: [],
              isJdHighlighted: false,
            });
          } else {
            // 첫 번째 workItem의 highlights 교체
            exp.workItems[0].highlights = highlights;
          }
          state.isDirty = true;
        }),
      markClean: () =>
        set((state) => {
          state.isDirty = false;
        }),
    })),
    { name: "resume-store" }
  )
);
