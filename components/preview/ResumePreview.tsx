"use client";

import { useResumeStore } from "@/stores/resume-store";
import { useUiStore } from "@/stores/ui-store";
import type { ExperienceEntry, Education, WorkItem } from "@/types/resume";

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

// 기본 정보 섹션
function PersonalInfoSection() {
  const { personalInfo } = useResumeStore((s) => s.resume);
  const hasInfo = personalInfo.name || personalInfo.email;

  if (!hasInfo) {
    return (
      <div className="pb-6" style={{ borderBottom: `1px solid ${RESUME_COLORS.divider}` }}>
        <EmptySection label="기본 정보" />
      </div>
    );
  }

  return (
    <div className="pb-6" style={{ borderBottom: `1px solid ${RESUME_COLORS.divider}` }}>
      {personalInfo.name && (
        <h1 className="text-[26px] font-extrabold tracking-[-0.03em]" style={{ color: RESUME_COLORS.name }}>
          {personalInfo.name}
        </h1>
      )}
      <div
        className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px]"
        style={{ color: RESUME_COLORS.contact }}
      >
        {personalInfo.email && <span>{personalInfo.email}</span>}
        {personalInfo.phone && <span>{personalInfo.phone}</span>}
        {personalInfo.location && <span>{personalInfo.location}</span>}
        {personalInfo.website && (
          <a
            href={personalInfo.website}
            className="hover:underline"
            style={{ color: RESUME_COLORS.sectionTitle }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {personalInfo.website}
          </a>
        )}
        {personalInfo.linkedin && (
          <a
            href={personalInfo.linkedin}
            className="hover:underline"
            style={{ color: RESUME_COLORS.sectionTitle }}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        )}
        {personalInfo.github && (
          <a
            href={personalInfo.github}
            className="hover:underline"
            style={{ color: RESUME_COLORS.sectionTitle }}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}

// 간략 소개 섹션
function BriefIntroSection() {
  const { briefIntro } = useResumeStore((s) => s.resume);

  return (
    <section aria-label="간략 소개">
      <SectionHeading>간략 소개</SectionHeading>
      {briefIntro?.text ? (
        <p className="text-[13px] leading-[1.75]" style={{ color: RESUME_COLORS.body }}>
          {briefIntro.text}
        </p>
      ) : (
        <EmptySection label="간략 소개" />
      )}
    </section>
  );
}

// 핵심역량 섹션
function CoreCompetenciesSection() {
  const { coreCompetencies } = useResumeStore((s) => s.resume);
  const items = coreCompetencies?.items ?? [];

  return (
    <section aria-label="핵심역량">
      <SectionHeading>핵심역량</SectionHeading>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{
                background: RESUME_COLORS.skillBg,
                border: `1px solid ${RESUME_COLORS.skillBorder}`,
                color: RESUME_COLORS.skillText,
              }}
            >
              {item.title}
            </span>
          ))}
        </div>
      ) : (
        <EmptySection label="핵심역량" />
      )}
    </section>
  );
}

// 경력 WorkItem 단일 렌더
function WorkItemEntry({ item }: { item: WorkItem }) {
  const isJdMatch = item.isJdHighlighted;

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
              {h.formatted || h.raw}
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

  return (
    <div
      className={`flex flex-col gap-3 ${isJdMatch ? "rounded-r-sm py-1" : ""}`}
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
            {entry.company}
          </span>
          {entry.department && (
            <span className="ml-2 text-[12px]" style={{ color: RESUME_COLORS.subtitle }}>
              {entry.department}
            </span>
          )}
          <div className="text-[12px]" style={{ color: RESUME_COLORS.subtitle }}>
            {entry.role}
          </div>
        </div>
        <div className="text-right text-[11px]" style={{ color: RESUME_COLORS.subtitle }}>
          <div>
            {entry.startDate} ~ {entry.endDate ?? "현재"}
          </div>
          {entry.location && <div>{entry.location}</div>}
        </div>
      </div>
      {entry.workItems.length > 0 && (
        <div
          className="ml-2 flex flex-col gap-4 border-l-2 pl-4"
          style={{ borderColor: RESUME_COLORS.timelineBorder }}
        >
          {entry.workItems.map((item) => (
            <WorkItemEntry key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// 경력 섹션
function ExperienceSection() {
  const { experience } = useResumeStore((s) => s.resume);

  return (
    <section aria-label="경력">
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
    </section>
  );
}

// 학력 단일 Entry 렌더
function EducationEntryItem({ entry }: { entry: Education }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <span className="text-[13px] font-medium" style={{ color: RESUME_COLORS.body }}>
          {entry.institution}
        </span>
        <div className="text-[12px]" style={{ color: RESUME_COLORS.subtitle }}>
          {entry.degree} · {entry.field}
          {entry.gpa && ` · GPA ${entry.gpa}`}
        </div>
        {entry.achievements.length > 0 && (
          <ul className="ml-3 mt-1 flex list-disc flex-col gap-0.5">
            {entry.achievements.map((ach, i) => (
              <li key={i} className="text-[11px]" style={{ color: RESUME_COLORS.subtitle }}>
                {ach}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="text-right text-[11px]" style={{ color: RESUME_COLORS.subtitle }}>
        {entry.startDate} ~ {entry.endDate ?? "재학 중"}
      </div>
    </div>
  );
}

// 학력 섹션
function EducationSection() {
  const { education } = useResumeStore((s) => s.resume);

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
    </section>
  );
}

// 기술 스택 섹션
function SkillsSection() {
  const { skills } = useResumeStore((s) => s.resume);
  const hasSkills =
    skills.technical.length > 0 ||
    (skills.languages && skills.languages.length > 0) ||
    (skills.certifications && skills.certifications.length > 0);

  return (
    <section aria-label="기술 스택">
      <SectionHeading>기술 스택</SectionHeading>
      {hasSkills ? (
        <div className="flex flex-col gap-3">
          {skills.technical.map((group) => (
            <div key={group.category} className="flex items-start gap-3">
              <span
                className="w-24 flex-shrink-0 text-[12px] font-medium"
                style={{ color: RESUME_COLORS.subtitle }}
              >
                {group.category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded px-1.5 py-0.5 text-[12px] font-medium"
                    style={{
                      background: RESUME_COLORS.techBg,
                      border: `1px solid ${RESUME_COLORS.techBorder}`,
                      color: RESUME_COLORS.techText,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {skills.languages && skills.languages.length > 0 && (
            <div className="flex items-start gap-3">
              <span
                className="w-24 flex-shrink-0 text-[12px] font-medium"
                style={{ color: RESUME_COLORS.subtitle }}
              >
                어학
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skills.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded px-1.5 py-0.5 text-[12px] font-medium"
                    style={{
                      background: RESUME_COLORS.techBg,
                      border: `1px solid ${RESUME_COLORS.techBorder}`,
                      color: RESUME_COLORS.techText,
                    }}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
          {skills.certifications && skills.certifications.length > 0 && (
            <div className="flex items-start gap-3">
              <span
                className="w-24 flex-shrink-0 text-[12px] font-medium"
                style={{ color: RESUME_COLORS.subtitle }}
              >
                자격증
              </span>
              <div className="flex flex-col gap-1">
                {skills.certifications.map((cert) => (
                  <span key={cert} className="text-[13px]" style={{ color: RESUME_COLORS.body }}>
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptySection label="기술 스택" />
      )}
    </section>
  );
}

export function ResumePreview() {
  const { isPreviewLoading } = useUiStore();

  return (
    // 외부 컨테이너: 테마 무관 고정 배경색 (종이 느낌)
    <main
      className="flex flex-1 items-start justify-center overflow-y-auto p-8"
      style={{ background: "#e8e8f0" }}
      aria-label="이력서 미리보기"
    >
      {/* 이력서 카드: 항상 흰색 — max-w 640px */}
      <div
        className="w-full max-w-[640px] min-h-[900px] rounded-lg"
        style={{
          background: "#ffffff",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {isPreviewLoading ? (
          <PreviewSkeleton />
        ) : (
          <div className="flex flex-col gap-8 px-10 py-9">
            <PersonalInfoSection />
            <BriefIntroSection />
            <CoreCompetenciesSection />
            <ExperienceSection />
            <EducationSection />
            <SkillsSection />
          </div>
        )}
      </div>
    </main>
  );
}
