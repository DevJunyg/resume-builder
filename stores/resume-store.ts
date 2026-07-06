import { create, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { createEmptyResume } from "@/lib/resume/schema";
import type { Resume, Tone, JdMetadata, CoreCompetency, ExperienceEntry, StarHighlight, EmploymentType } from "@/types/resume";

// SSR 안전 스토리지 — 서버 렌더 시 localStorage 접근으로 인한 크래시 방지
const resumeStorage = createJSONStorage<{ resume: Resume }>(() =>
  typeof window !== "undefined"
    ? window.localStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
);

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
  reorderSections: (fromIndex: number, toIndex: number) => void;
  markClean: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    temporal(
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
        reorderSections: (fromIndex, toIndex) =>
          set((state) => {
            const sections = state.resume.sections;
            const [moved] = sections.splice(fromIndex, 1);
            sections.splice(toIndex, 0, moved);
            // order 필드 재계산
            sections.forEach((s, i) => {
              s.order = i;
            });
            state.isDirty = true;
          }),
        markClean: () =>
          set((state) => {
            state.isDirty = false;
          }),
      })),
      { name: "resume-store" }
    ),
      {
        // 변경을 history에 저장할 조건 — isDirty 변경은 제외
        partialize: (state) => ({
          resume: state.resume,
        }),
        limit: 30, // 최대 30단계
      }
    ),
    // localStorage 지속성 — 새로고침/탭 종료 후에도 이력서 유지
    {
      name: "resume-storage",
      version: 1,
      storage: resumeStorage,
      // SSR 하이드레이션 불일치 방지 — builder 페이지 마운트 후 수동 rehydrate
      skipHydration: true,
      partialize: (state) => ({ resume: state.resume }),
    }
  )
);

// temporal store 별도 export (undo/redo 접근용)
export const useTemporalStore = <T>(
  selector: (state: ReturnType<typeof useResumeStore.temporal.getState>) => T
) => useStore(useResumeStore.temporal, selector);
