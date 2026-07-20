"use client";

import { useRef } from "react";
import { useResumeStore } from "@/stores/resume-store";
import { useUiStore } from "@/stores/ui-store";
import { useDiffStore } from "@/stores/diff-store";
import { TextRewriteMenu } from "./TextRewriteMenu";
import { EditableText } from "./EditableText";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, X } from "lucide-react";
import type { ExperienceEntry, Education, WorkItem, ResumeSection, SectionType } from "@/types/resume";

// 이력서 카드 내부는 항상 흰색 배경 — 고정 색상 사용 (테마 무관)
const RESUME_COLORS = {
  name: "#0d0d1a",
  subtitle: "#6868a0",
  contact: "#4a4a6a",
  sectionTitle: "#4a4a8a",
  body: "#2d2d4a",
  divider: "rgba(99,102,241,0.12)",
  skillBg: "#f0f0f8",
  skillBorder: "#e0e0f0",
  skillText: "#4a4a8a",
  techBg: "#f8f8fc",
  techBorder: "#e0e0f0",
  techText: "#5050a0",
  emptyBg: "#f8f8fc",
  emptyBorder: "#e0e0f0",
  emptyText: "#7878a8",
  timelineBorder: "rgba(99,102,241,0.15)",
};

// 스켈레톤 블록
function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton rounded bg-[#e0e0f0] ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

// A4 스켈레톤 로딩
function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-10 py-9">
      <div className="flex flex-col gap-3 border-b pb-6" style={{ borderColor: RESUME_COLORS.divider }}>
        <SkeletonBar className="h-7 w-40" />
        <SkeletonBar className="h-3.5 w-56" />
        <div className="flex gap-4">
          <SkeletonBar className="h-3 w-28" />
          <SkeletonBar className="h-3 w-24" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-3">
          <SkeletonBar className="h-4 w-20" />
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-5/6" />
          <SkeletonBar className="h-3 w-4/6" />
        </div>
      ))}
    </div>
  );
}

// 빈 섹션 플레이스홀더 (이력서 내부 — 흰 배경에 맞는 고정 색)
function EmptySection({ label }: { label: string }) {
  return (
    <div
      className="rounded-md px-3.5 py-2.5 text-[13px]"
      style={{
        background: RESUME_COLORS.emptyBg,
        border: `1px dashed ${RESUME_COLORS.emptyBorder}`,
        color: RESUME_COLORS.emptyText,
      }}
    >
      {label} 정보가 없습니다.
    </div>
  );
}

// "추가" 버튼 — 인쇄에서는 숨김 (편집 전용 UI)
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="print-hide mt-2 inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-[11px] transition-colors"
      style={{ borderColor: RESUME_COLORS.emptyBorder, color: RESUME_COLORS.emptyText }}
    >
      <Plus className="h-3 w-3" aria-hidden="true" />
      {label}
    </button>
  );
}

// 칩/항목 삭제용 작은 X — hover 시 노출, 인쇄 제외
function ChipDelete({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="print-hide ml-0.5 hidden h-3.5 w-3.5 items-center justify-center rounded-full text-[#c0c0d8] transition-colors hover:bg-red-50 hover:text-red-500 group-hover/chip:inline-flex"
    >
      <X className="h-2.5 w-2.5" aria-hidden="true" />
    </button>
  );
}

// 섹션 구분 제목 (이력서용 — 항상 고정색)
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
      style={{
        color: RESUME_COLORS.sectionTitle,
        borderBottom: `1.5px solid ${RESUME_COLORS.divider}`,
      }}
    >
      {children}
    </h2>
  );
}

// 기본 정보 섹션 (클릭해서 직접 편집)
function PersonalInfoSection() {
  const { personalInfo } = useResumeStore((s) => s.resume);
  const updatePersonalInfo = useResumeStore((s) => s.updatePersonalInfo);
  const { diffs } = useDiffStore();
  const phase = diffs["personal-info"];

  return (
    <div
      className={`pb-6 ${phase ? "diff-new rounded-md" : ""}`}
      style={{ borderBottom: `1px solid ${RESUME_COLORS.divider}` }}
    >
      <h1 className="text-[26px] font-extrabold tracking-[-0.03em]" style={{ color: RESUME_COLORS.name }}>
        <EditableText
          value={personalInfo.name}
          onCommit={(v) => updatePersonalInfo({ name: v })}
          ariaLabel="이름"
          placeholder="이름"
          className="text-[26px] font-extrabold tracking-[-0.03em]"
        />
      </h1>
      <div
        className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]"
        style={{ color: RESUME_COLORS.contact }}
      >
        <EditableText value={personalInfo.email} onCommit={(v) => updatePersonalInfo({ email: v })} ariaLabel="이메일" placeholder="이메일" />
        <EditableText value={personalInfo.phone ?? ""} onCommit={(v) => updatePersonalInfo({ phone: v })} ariaLabel="전화번호" placeholder="전화번호" />
        <EditableText value={personalInfo.location ?? ""} onCommit={(v) => updatePersonalInfo({ location: v })} ariaLabel="위치" placeholder="위치" />
        <EditableText value={personalInfo.website ?? ""} onCommit={(v) => updatePersonalInfo({ website: v })} ariaLabel="웹사이트" placeholder="웹사이트" />
        {/* LinkedIn/GitHub는 값이 있을 때 링크로 표시 (URL 편집은 채팅/추후 지원) */}
        {personalInfo.linkedin && (
          <a href={personalInfo.linkedin} className="hover:underline" style={{ color: RESUME_COLORS.sectionTitle }} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        )}
        {personalInfo.github && (
          <a href={personalInfo.github} className="hover:underline" style={{ color: RESUME_COLORS.sectionTitle }} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}

// 간략 소개 섹션 (클릭해서 직접 편집)
function BriefIntroSection() {
  const { briefIntro } = useResumeStore((s) => s.resume);
  const updateBriefIntro = useResumeStore((s) => s.updateBriefIntro);
  const { diffs } = useDiffStore();
  const phase = diffs["brief-intro"];

  return (
    <section aria-label="간략 소개" className={phase ? "diff-new rounded-md" : ""}>
      <SectionHeading>간략 소개</SectionHeading>
      <p className="text-[13px] leading-[1.75]" style={{ color: RESUME_COLORS.body }}>
        <EditableText
          value={briefIntro?.text ?? ""}
          onCommit={(v) => updateBriefIntro(v, false)}
          ariaLabel="간략 소개"
          placeholder="간단한 자기소개를 입력하세요"
          multiline
          className="text-[13px] leading-[1.75]"
        />
      </p>
    </section>
  );
}

// 핵심역량 섹션 (칩 편집/추가/삭제)
function CoreCompetenciesSection() {
  const { coreCompetencies } = useResumeStore((s) => s.resume);
  const updateCoreCompetencies = useResumeStore((s) => s.updateCoreCompetencies);
  const { diffs } = useDiffStore();
  const phase = diffs["core-competencies"];
  const items = coreCompetencies?.items ?? [];

  return (
    <section aria-label="핵심역량" className={phase ? "diff-new rounded-md" : ""}>
      <SectionHeading>핵심역량</SectionHeading>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <span
            key={item.id}
            className="group/chip inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{
              background: RESUME_COLORS.skillBg,
              border: `1px solid ${RESUME_COLORS.skillBorder}`,
              color: RESUME_COLORS.skillText,
            }}
          >
            <EditableText
              value={item.title}
              onCommit={(v) =>
                updateCoreCompetencies(items.map((i) => (i.id === item.id ? { ...i, title: v } : i)))
              }
              ariaLabel="핵심역량"
              placeholder="역량"
              className="text-[12px] font-semibold"
            />
            <ChipDelete
              label="역량 삭제"
              onClick={() => updateCoreCompetencies(items.filter((i) => i.id !== item.id))}
            />
          </span>
        ))}
      </div>
      <AddButton
        label="역량 추가"
        onClick={() =>
          updateCoreCompetencies([...items, { id: crypto.randomUUID(), title: "" }])
        }
      />
    </section>
  );
}

// 경력 WorkItem 단일 렌더
function WorkItemEntry({ item, experienceId }: { item: WorkItem; experienceId: string }) {
  const isJdMatch = item.isJdHighlighted;
  const updateHighlight = useResumeStore((s) => s.updateHighlight);

  return (
    <div
      className={`flex flex-col gap-1 ${isJdMatch ? "rounded-r-sm py-1" : ""}`}
      style={
        isJdMatch
          ? {
              borderLeft: "3px solid #22d3ee",
              paddingLeft: "12px",
              marginLeft: "-15px",
              background: "rgba(34,211,238,0.05)",
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium" style={{ color: RESUME_COLORS.body }}>
          {item.title}
        </span>
        {(item.startDate || item.endDate !== undefined) && (
          <span className="text-[11px]" style={{ color: RESUME_COLORS.subtitle }}>
            {item.startDate} ~ {item.endDate ?? "진행 중"}
          </span>
        )}
      </div>
      {item.role && (
        <span className="text-[11px]" style={{ color: RESUME_COLORS.subtitle }}>
          {item.role}
        </span>
      )}
      <p className="text-[13px] leading-[1.75]" style={{ color: RESUME_COLORS.body }}>
        {item.description}
      </p>
      {item.highlights.length > 0 && (
        <ul className="ml-4 flex list-disc flex-col gap-1">
          {item.highlights.map((h) => (
            <li key={h.id} className="text-[13px]" style={{ color: RESUME_COLORS.body }}>
              <EditableText
                value={h.formatted || h.raw}
                onCommit={(v) => updateHighlight(experienceId, item.id, h.id, v)}
                ariaLabel="경력 성과 항목"
                multiline
                className="text-[13px]"
              />
            </li>
          ))}
        </ul>
      )}
      {item.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {item.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded px-1.5 py-0.5 text-[12px] font-medium"
              style={{
                background: RESUME_COLORS.techBg,
                border: `1px solid ${RESUME_COLORS.techBorder}`,
                color: RESUME_COLORS.techText,
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// 경력 단일 Entry 렌더
function ExperienceEntryItem({ entry }: { entry: ExperienceEntry }) {
  const isJdMatch = entry.isJdHighlighted;
  const deleteExperience = useResumeStore((s) => s.deleteExperience);
  const updateExperience = useResumeStore((s) => s.updateExperience);

  return (
    <div
      className={`pdf-block group/entry flex flex-col gap-3 ${isJdMatch ? "rounded-r-sm py-1" : ""}`}
      style={
        isJdMatch
          ? {
              borderLeft: "3px solid #22d3ee",
              paddingLeft: "12px",
              marginLeft: "-15px",
              background: "rgba(34,211,238,0.05)",
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[13px] font-semibold" style={{ color: RESUME_COLORS.body }}>
            <EditableText
              value={entry.company}
              onCommit={(v) => updateExperience(entry.id, { company: v })}
              ariaLabel="회사명"
              placeholder="회사명"
              className="text-[13px] font-semibold"
            />
          </span>
          {entry.department && (
            <span className="ml-2 text-[12px]" style={{ color: RESUME_COLORS.subtitle }}>
              {entry.department}
            </span>
          )}
          <div className="text-[12px]" style={{ color: RESUME_COLORS.subtitle }}>
            <EditableText
              value={entry.role}
              onCommit={(v) => updateExperience(entry.id, { role: v })}
              ariaLabel="직무"
              placeholder="직무"
              className="text-[12px]"
            />
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <div className="text-right text-[11px]" style={{ color: RESUME_COLORS.subtitle }}>
            <div className="flex items-center justify-end gap-1">
              <EditableText
                value={entry.startDate}
                onCommit={(v) => updateExperience(entry.id, { startDate: v })}
                ariaLabel="입사 시기"
                placeholder="YYYY-MM"
                className="text-[11px]"
              />
              <span>~</span>
              <EditableText
                value={entry.endDate ?? "현재"}
                onCommit={(v) => updateExperience(entry.id, { endDate: v })}
                ariaLabel="퇴사 시기 (비우면 현재)"
                className="text-[11px]"
              />
            </div>
            {entry.location && <div>{entry.location}</div>}
          </div>
          {/* 항목 삭제 — hover 시 노출, 인쇄 제외, Ctrl+Z로 복구 가능 */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`'${entry.company}' 경력을 삭제할까요?`)) {
                deleteExperience(entry.id);
              }
            }}
            className="print-hide hidden h-5 w-5 items-center justify-center rounded text-[#c0c0d8] transition-colors hover:bg-red-50 hover:text-red-500 group-hover/entry:inline-flex"
            aria-label={`${entry.company} 경력 삭제`}
            title="이 경력 삭제"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {entry.workItems.length > 0 && (
        <div
          className="ml-2 flex flex-col gap-4 border-l-2 pl-4"
          style={{ borderColor: RESUME_COLORS.timelineBorder }}
        >
          {entry.workItems.map((item) => (
            <WorkItemEntry key={item.id} item={item} experienceId={entry.id} />
          ))}
        </div>
      )}
    </div>
  );
}

// 경력 섹션
function ExperienceSection() {
  const { experience } = useResumeStore((s) => s.resume);
  const addBlankExperience = useResumeStore((s) => s.addBlankExperience);
  const { diffs } = useDiffStore();
  const phase = diffs["experience"];

  return (
    <section aria-label="경력" className={phase ? "diff-new rounded-md" : ""}>
      <SectionHeading>경력</SectionHeading>
      {experience.length > 0 ? (
        <div className="flex flex-col gap-6">
          {experience.map((entry) => (
            <ExperienceEntryItem key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptySection label="경력" />
      )}
      <AddButton label="경력 추가" onClick={addBlankExperience} />
    </section>
  );
}

// 학력 단일 Entry 렌더 (클릭 편집)
function EducationEntryItem({ entry }: { entry: Education }) {
  const deleteEducation = useResumeStore((s) => s.deleteEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);

  return (
    <div className="pdf-block group/entry flex items-start justify-between">
      <div className="min-w-0">
        <span className="text-[13px] font-medium" style={{ color: RESUME_COLORS.body }}>
          <EditableText
            value={entry.institution}
            onCommit={(v) => updateEducation(entry.id, { institution: v })}
            ariaLabel="학교명"
            placeholder="학교명"
            className="text-[13px] font-medium"
          />
        </span>
        <div className="flex flex-wrap items-center gap-x-1 text-[12px]" style={{ color: RESUME_COLORS.subtitle }}>
          <EditableText value={entry.degree} onCommit={(v) => updateEducation(entry.id, { degree: v })} ariaLabel="학위" placeholder="학위" className="text-[12px]" />
          <span>·</span>
          <EditableText value={entry.field} onCommit={(v) => updateEducation(entry.id, { field: v })} ariaLabel="전공" placeholder="전공" className="text-[12px]" />
          <span>· GPA</span>
          <EditableText value={entry.gpa ?? ""} onCommit={(v) => updateEducation(entry.id, { gpa: v })} ariaLabel="학점" placeholder="학점" className="text-[12px]" />
        </div>
        <ul className="ml-3 mt-1 flex list-disc flex-col gap-0.5">
          {entry.achievements.map((ach, i) => (
            <li key={i} className="group/chip text-[11px]" style={{ color: RESUME_COLORS.subtitle }}>
              <EditableText
                value={ach}
                onCommit={(v) =>
                  updateEducation(entry.id, {
                    achievements: entry.achievements.map((a, j) => (j === i ? v : a)),
                  })
                }
                ariaLabel="학력 상세"
                className="text-[11px]"
              />
              <ChipDelete
                label="항목 삭제"
                onClick={() =>
                  updateEducation(entry.id, {
                    achievements: entry.achievements.filter((_, j) => j !== i),
                  })
                }
              />
            </li>
          ))}
        </ul>
        <AddButton
          label="상세 추가"
          onClick={() => updateEducation(entry.id, { achievements: [...entry.achievements, ""] })}
        />
      </div>
      <div className="flex items-start gap-1.5">
        <div className="flex items-center gap-1 text-right text-[11px]" style={{ color: RESUME_COLORS.subtitle }}>
          <EditableText value={entry.startDate} onCommit={(v) => updateEducation(entry.id, { startDate: v })} ariaLabel="입학 시기" placeholder="YYYY-MM" className="text-[11px]" />
          <span>~</span>
          <EditableText value={entry.endDate ?? "재학 중"} onCommit={(v) => updateEducation(entry.id, { endDate: v })} ariaLabel="졸업 시기 (비우면 재학 중)" className="text-[11px]" />
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`'${entry.institution}' 학력을 삭제할까요?`)) {
              deleteEducation(entry.id);
            }
          }}
          className="print-hide hidden h-5 w-5 items-center justify-center rounded text-[#c0c0d8] transition-colors hover:bg-red-50 hover:text-red-500 group-hover/entry:inline-flex"
          aria-label={`${entry.institution} 학력 삭제`}
          title="이 학력 삭제"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// 학력 섹션
function EducationSection() {
  const { education } = useResumeStore((s) => s.resume);
  const addBlankEducation = useResumeStore((s) => s.addBlankEducation);

  return (
    <section aria-label="학력">
      <SectionHeading>학력</SectionHeading>
      {education.length > 0 ? (
        <div className="flex flex-col gap-4">
          {education.map((entry) => (
            <EducationEntryItem key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptySection label="학력" />
      )}
      <AddButton label="학력 추가" onClick={addBlankEducation} />
    </section>
  );
}

// 기술 칩 (편집/삭제)
function SkillChip({ value, onCommit, onDelete }: { value: string; onCommit: (v: string) => void; onDelete: () => void }) {
  return (
    <span
      className="group/chip inline-flex items-center rounded px-1.5 py-0.5 text-[12px] font-medium"
      style={{ background: RESUME_COLORS.techBg, border: `1px solid ${RESUME_COLORS.techBorder}`, color: RESUME_COLORS.techText }}
    >
      <EditableText value={value} onCommit={onCommit} ariaLabel="기술" placeholder="기술" className="text-[12px] font-medium" />
      <ChipDelete label="삭제" onClick={onDelete} />
    </span>
  );
}

// 카테고리 라벨 (편집)
function CategoryLabel({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  return (
    <span className="w-24 flex-shrink-0 text-[12px] font-medium" style={{ color: RESUME_COLORS.subtitle }}>
      <EditableText value={value} onCommit={onCommit} ariaLabel="카테고리" placeholder="카테고리" className="text-[12px] font-medium" />
    </span>
  );
}

// 기술 스택 섹션 (인라인 편집/추가/삭제)
function SkillsSection() {
  const { skills } = useResumeStore((s) => s.resume);
  const updateSkills = useResumeStore((s) => s.updateSkills);
  const languages = skills.languages ?? [];
  const certifications = skills.certifications ?? [];

  const setTechnical = (technical: typeof skills.technical) => updateSkills({ ...skills, technical });
  const setLanguages = (langs: string[]) => updateSkills({ ...skills, languages: langs });
  const setCertifications = (certs: string[]) => updateSkills({ ...skills, certifications: certs });

  return (
    <section aria-label="기술 스택">
      <SectionHeading>기술 스택</SectionHeading>
      <div className="flex flex-col gap-3">
        {skills.technical.map((group, gi) => (
          <div key={gi} className="group/entry flex items-start gap-3">
            <CategoryLabel
              value={group.category}
              onCommit={(v) => setTechnical(skills.technical.map((g, i) => (i === gi ? { ...g, category: v } : g)))}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {group.items.map((item, ii) => (
                <SkillChip
                  key={ii}
                  value={item}
                  onCommit={(v) =>
                    setTechnical(skills.technical.map((g, i) => (i === gi ? { ...g, items: g.items.map((it, j) => (j === ii ? v : it)) } : g)))
                  }
                  onDelete={() =>
                    setTechnical(skills.technical.map((g, i) => (i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g)))
                  }
                />
              ))}
              <button
                type="button"
                onClick={() => setTechnical(skills.technical.map((g, i) => (i === gi ? { ...g, items: [...g.items, ""] } : g)))}
                className="print-hide inline-flex h-5 w-5 items-center justify-center rounded text-[#c0c0d8] hover:bg-[#eef2ff] hover:text-accent-brand"
                aria-label="기술 추가"
                title="기술 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </button>
              <ChipDelete label="카테고리 삭제" onClick={() => setTechnical(skills.technical.filter((_, i) => i !== gi))} />
            </div>
          </div>
        ))}

        {/* 어학 */}
        <div className="flex items-start gap-3">
          <span className="w-24 flex-shrink-0 text-[12px] font-medium" style={{ color: RESUME_COLORS.subtitle }}>어학</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {languages.map((lang, i) => (
              <SkillChip
                key={i}
                value={lang}
                onCommit={(v) => setLanguages(languages.map((l, j) => (j === i ? v : l)))}
                onDelete={() => setLanguages(languages.filter((_, j) => j !== i))}
              />
            ))}
            <button
              type="button"
              onClick={() => setLanguages([...languages, ""])}
              className="print-hide inline-flex h-5 w-5 items-center justify-center rounded text-[#c0c0d8] hover:bg-[#eef2ff] hover:text-accent-brand"
              aria-label="어학 추가"
              title="어학 추가"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 자격증 */}
        <div className="flex items-start gap-3">
          <span className="w-24 flex-shrink-0 text-[12px] font-medium" style={{ color: RESUME_COLORS.subtitle }}>자격증</span>
          <div className="flex flex-col gap-1">
            {certifications.map((cert, i) => (
              <span key={i} className="group/chip text-[13px]" style={{ color: RESUME_COLORS.body }}>
                <EditableText
                  value={cert}
                  onCommit={(v) => setCertifications(certifications.map((c, j) => (j === i ? v : c)))}
                  ariaLabel="자격증"
                  placeholder="자격증"
                  className="text-[13px]"
                />
                <ChipDelete label="자격증 삭제" onClick={() => setCertifications(certifications.filter((_, j) => j !== i))} />
              </span>
            ))}
            <AddButton label="자격증 추가" onClick={() => setCertifications([...certifications, ""])} />
          </div>
        </div>
      </div>
      <AddButton label="카테고리 추가" onClick={() => setTechnical([...skills.technical, { category: "", items: [] }])} />
    </section>
  );
}

// SectionType → 컴포넌트 매핑
const SECTION_COMPONENTS: Partial<Record<SectionType, React.FC>> = {
  personalInfo: PersonalInfoSection,
  briefIntro: BriefIntroSection,
  coreCompetencies: CoreCompetenciesSection,
  experience: ExperienceSection,
  education: EducationSection,
  skills: SkillsSection,
};

// 드래그 핸들이 있는 정렬 가능한 섹션 래퍼
function SortableSection({
  section,
  children,
}: {
  section: ResumeSection;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };

  // personalInfo 섹션은 드래그 핸들 미표시 (UX상 맨 위 고정)
  const showHandle = section.type !== "personalInfo";

  return (
    <div ref={setNodeRef} style={style} className="group">
      {showHandle && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-6 top-1/2 -translate-y-1/2 hidden cursor-grab items-center justify-center group-hover:flex"
          aria-label="섹션 이동"
        >
          <GripVertical className="h-4 w-4 text-[#c0c0d8]" aria-hidden="true" />
        </div>
      )}
      {children}
    </div>
  );
}

export function ResumePreview() {
  const { isPreviewLoading } = useUiStore();
  const resume = useResumeStore((s) => s.resume);
  const reorderSections = useResumeStore((s) => s.reorderSections);
  const resumeCardRef = useRef<HTMLDivElement>(null);

  // sections를 order 순으로 정렬해 렌더 (isVisible 필터링)
  const sortedSections = [...resume.sections]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
    const newIndex = sortedSections.findIndex((s) => s.id === over.id);
    reorderSections(oldIndex, newIndex);
  };

  return (
    // 외부 컨테이너: 테마 무관 고정 배경색 (종이 느낌)
    <main
      id="resume-print-area"
      className="flex flex-1 items-start justify-center overflow-y-auto p-8"
      style={{ background: "#e8e8f0" }}
      aria-label="이력서 미리보기"
    >
      {/* 컨텍스트 메뉴: 이력서 카드 내 텍스트 선택 → AI 재작성 → 스토어에 반영 */}
      <TextRewriteMenu
        containerRef={resumeCardRef}
        onRewrite={(original, rewritten) => {
          // 선택 텍스트가 속한 필드를 찾아 스토어를 갱신한다(DOM 직접 수정 X → 새로고침/DB에도 보존).
          const orig = original.trim();
          const next = rewritten.trim();
          if (!orig || !next) return;
          const state = useResumeStore.getState();

          // 1) 자기소개
          const intro = state.resume.briefIntro?.text ?? "";
          if (intro.includes(orig)) {
            state.updateBriefIntro(intro.replace(orig, next), false);
            return;
          }
          // 2) 경력 성과(하이라이트)
          for (const exp of state.resume.experience) {
            for (const wi of exp.workItems) {
              const h = wi.highlights.find((x) => (x.formatted || x.raw).includes(orig));
              if (h) {
                const cur = h.formatted || h.raw;
                state.updateHighlight(exp.id, wi.id, h.id, cur.replace(orig, next));
                return;
              }
            }
          }
          // 매칭 실패: 선택 텍스트를 특정 필드로 확정할 수 없어 무시(직접 편집을 권장)
        }}
      />

      {/* 이력서 카드: 항상 흰색 — max-w 640px */}
      <div
        ref={resumeCardRef}
        className="resume-card w-full max-w-[640px] min-h-[900px] rounded-lg"
        style={{
          background: "#ffffff",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {isPreviewLoading ? (
          <PreviewSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedSections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="group flex flex-col gap-8 px-10 py-9">
                {sortedSections.map((section) => {
                  const Component = SECTION_COMPONENTS[section.type];
                  if (!Component) return null;
                  return (
                    <SortableSection key={section.id} section={section}>
                      <Component />
                    </SortableSection>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </main>
  );
}
