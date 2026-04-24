import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Diff 하이라이트 단계: 1=yellow, 2=green, 3=fade
type DiffPhase = 1 | 2 | 3;

interface DiffState {
  diffs: Record<string, DiffPhase>; // sectionId → 현재 phase
  triggerDiff: (sectionIds: string[]) => void; // 새 diff 시작
  clearDiff: (sectionId: string) => void; // 단일 섹션 diff 제거
}

export const useDiffStore = create<DiffState>()(
  devtools(
    (set) => ({
      diffs: {},

      triggerDiff: (sectionIds) => {
        // 1단계: yellow(1)로 설정
        set((state) => {
          const next = { ...state.diffs };
          for (const id of sectionIds) {
            next[id] = 1;
          }
          return { diffs: next };
        });

        // 1000ms 후 → green(2)으로 전환
        setTimeout(() => {
          set((state) => {
            const next = { ...state.diffs };
            for (const id of sectionIds) {
              if (next[id] !== undefined) next[id] = 2;
            }
            return { diffs: next };
          });
        }, 1000);

        // 3800ms 후 → fade(3)으로 전환
        setTimeout(() => {
          set((state) => {
            const next = { ...state.diffs };
            for (const id of sectionIds) {
              if (next[id] !== undefined) next[id] = 3;
            }
            return { diffs: next };
          });
        }, 3800);

        // 5000ms 후 → state에서 제거
        setTimeout(() => {
          const { clearDiff } = useDiffStore.getState();
          for (const id of sectionIds) {
            clearDiff(id);
          }
        }, 5000);
      },

      clearDiff: (sectionId) => {
        set((state) => {
          const next = { ...state.diffs };
          delete next[sectionId];
          return { diffs: next };
        });
      },
    }),
    { name: "diff-store" }
  )
);
