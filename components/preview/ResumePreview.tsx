"use client";

import { useResumeStore } from "@/stores/resume-store";
import { useUiStore } from "@/stores/ui-store";
import type { ExperienceEntry, Education, WorkItem } from "@/types/resume";

// A4 비율 스켈레톤
function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-10">
      {/* 이름 스켈레톤 */}
      <div className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="flex gap-4">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        </div>
      </div>
      {/* 섹션 스켈레톤 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// 빈 섹션 플레이스홀더
function EmptySection({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
      {label} 정보가 없습니다.
    </div>
  );
}

// 기본 정보 섹션
function PersonalInfoSection() {
  const { personalInfo } = useResumeStore((s) => s.resume);

  const hasInfo = personalInfo.name || personalInfo.email;

  if (!hasInfo) {
    return (
      <div className="border-b border-border pb-6">
        <EmptySection label="기본 정보" />
      </div>
    );
  }

  return (
    <div className="border-b border-border pb-6">
      {personalInfo.name && (
        <h1 className="text-3xl font-bold text-foreground">{personalInfo.name}</h1>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {personalInfo.email && <span>{personalInfo.email}</span>}
        {personalInfo.phone && <span>{personalInfo.phone}</span>}
        {personalInfo.location && <span>{personalInfo.location}</span>}
        {personalInfo.website && (
          <a href={personalInfo.website} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            {personalInfo.website}
          </a>
        )}
        {personalInfo.linkedin && (
          <a href={personalInfo.linkedin} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        )}
        {personalInfo.github && (
          <a href={personalInfo.github} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
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
      <h2 className="mb-3 text-base font-semibold uppercase tracking-wide text-foreground">
        간략 소개
      </h2>
      {briefIntro?.text ? (
        <p className="text-sm leading-relaxed text-foreground">{briefIntro.text}</p>
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
      <h2 className="mb-3 text-base font-semibold uppercase tracking-wide text-foreground">
        핵심역량
      </h2>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
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

// 경력 단일 WorkItem 렌더
function WorkItemEntry({ item }: { item: WorkItem }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{item.title}</span>
        {(item.startDate || item.endDate) && (
          <span className="text-xs text-muted-foreground">
            {item.startDate} ~ {item.endDate ?? "진행 중"}
          </span>
        )}
      </div>
      {item.role && (
        <span className="text-xs text-muted-foreground">{item.role}</span>
      )}
      <p className="text-sm leading-relaxed text-foreground">{item.description}</p>
      {item.highlights.length > 0 && (
        <ul className="ml-4 flex list-disc flex-col gap-1">
          {item.highlights.map((h) => (
            <li key={h.id} className="text-sm text-foreground">
              {h.formatted || h.raw}
            </li>
          ))}
        </ul>
      )}
      {item.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {item.techStack.map((tech) => (
            <span key={tech} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
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
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-semibold text-foreground">{entry.company}</span>
          {entry.department && (
            <span className="ml-2 text-sm text-muted-foreground">{entry.department}</span>
          )}
          <div className="text-sm text-muted-foreground">{entry.role}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>{entry.startDate} ~ {entry.endDate ?? "현재"}</div>
          {entry.location && <div>{entry.location}</div>}
        </div>
      </div>
      {entry.workItems.length > 0 && (
        <div className="ml-2 flex flex-col gap-4 border-l-2 border-border pl-4">
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
      <h2 className="mb-4 text-base font-semibold uppercase tracking-wide text-foreground">
        경력
      </h2>
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
        <span className="font-medium text-foreground">{entry.institution}</span>
        <div className="text-sm text-muted-foreground">
          {entry.degree} · {entry.field}
          {entry.gpa && ` · GPA ${entry.gpa}`}
        </div>
        {entry.achievements.length > 0 && (
          <ul className="ml-3 mt-1 flex list-disc flex-col gap-0.5">
            {entry.achievements.map((ach, i) => (
              <li key={i} className="text-xs text-muted-foreground">{ach}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="text-right text-xs text-muted-foreground">
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
      <h2 className="mb-4 text-base font-semibold uppercase tracking-wide text-foreground">
        학력
      </h2>
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
      <h2 className="mb-4 text-base font-semibold uppercase tracking-wide text-foreground">
        기술 스택
      </h2>
      {hasSkills ? (
        <div className="flex flex-col gap-3">
          {skills.technical.map((group) => (
            <div key={group.category} className="flex items-start gap-3">
              <span className="w-24 flex-shrink-0 text-xs font-medium text-muted-foreground">
                {group.category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {skills.languages && skills.languages.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="w-24 flex-shrink-0 text-xs font-medium text-muted-foreground">어학</span>
              <div className="flex flex-wrap gap-1.5">
                {skills.languages.map((lang) => (
                  <span key={lang} className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
          {skills.certifications && skills.certifications.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="w-24 flex-shrink-0 text-xs font-medium text-muted-foreground">자격증</span>
              <div className="flex flex-col gap-1">
                {skills.certifications.map((cert) => (
                  <span key={cert} className="text-sm text-foreground">{cert}</span>
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
    <main
      className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/30 p-6"
      aria-label="이력서 미리보기"
    >
      {/* A4 비율 카드: 794px x 1123px 기준 */}
      <div className="w-full max-w-[794px] min-h-[1123px] rounded-lg border border-border bg-card shadow-md">
        {isPreviewLoading ? (
          <PreviewSkeleton />
        ) : (
          <div className="flex flex-col gap-8 p-10">
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
