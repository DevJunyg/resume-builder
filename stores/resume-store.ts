import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { createEmptyResume } from "@/lib/resume/schema";
import type { Resume, Tone } from "@/types/resume";

interface ResumeState {
  resume: Resume;
  isDirty: boolean;
  setResume: (resume: Resume) => void;
  updatePersonalInfo: (info: Partial<Resume["personalInfo"]>) => void;
  updateBriefIntro: (text: string, isAiGenerated?: boolean) => void;
  updateTone: (tone: Tone) => void;
  updateJd: (rawText: string) => void;
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
      markClean: () =>
        set((state) => {
          state.isDirty = false;
        }),
    })),
    { name: "resume-store" }
  )
);
