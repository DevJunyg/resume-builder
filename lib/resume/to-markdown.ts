import type { Resume } from "@/types/resume";

function formatDate(date: string | null | undefined): string {
  if (!date) return "현재";
  return date;
}

export function resumeToMarkdown(resume: Resume): string {
  const lines: string[] = [];
  const { personalInfo, briefIntro, coreCompetencies, experience, education, skills, sections } =
    resume;

  // sections 순서에 따라 섹션 렌더
  const sortedSections = [...sections]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    switch (section.type) {
      case "personalInfo": {
        if (personalInfo.name) lines.push(`# ${personalInfo.name}`);
        const contacts: string[] = [];
        if (personalInfo.email) contacts.push(personalInfo.email);
        if (personalInfo.phone) contacts.push(personalInfo.phone);
        if (personalInfo.location) contacts.push(personalInfo.location);
        if (personalInfo.website) contacts.push(personalInfo.website);
        if (personalInfo.linkedin) contacts.push(personalInfo.linkedin);
        if (personalInfo.github) contacts.push(personalInfo.github);
        if (contacts.length > 0) lines.push(contacts.join(" · "));
        lines.push("");
        break;
      }

      case "briefIntro": {
        if (briefIntro?.text) {
          lines.push("## 간략 소개");
          lines.push("");
          lines.push(briefIntro.text);
          lines.push("");
        }
        break;
      }

      case "coreCompetencies": {
        const items = coreCompetencies?.items ?? [];
        if (items.length > 0) {
          lines.push("## 핵심역량");
          lines.push("");
          lines.push(items.map((i) => `\`${i.title}\``).join(" · "));
          lines.push("");
        }
        break;
      }

      case "experience": {
        if (experience.length > 0) {
          lines.push("## 경력");
          lines.push("");
          for (const entry of experience) {
            lines.push(
              `### ${entry.company}${entry.department ? ` · ${entry.department}` : ""}`
            );
            lines.push(
              `**${entry.role}** | ${formatDate(entry.startDate)} ~ ${formatDate(entry.endDate)}${entry.location ? ` | ${entry.location}` : ""}`
            );
            lines.push("");
            for (const item of entry.workItems) {
              lines.push(`#### ${item.title}`);
              if (item.description) lines.push(item.description);
              if (item.highlights.length > 0) {
                lines.push("");
                for (const h of item.highlights) {
                  lines.push(`- ${h.formatted || h.raw}`);
                }
              }
              if (item.techStack.length > 0) {
                lines.push("");
                lines.push(`**기술 스택**: ${item.techStack.join(", ")}`);
              }
              lines.push("");
            }
          }
        }
        break;
      }

      case "education": {
        if (education.length > 0) {
          lines.push("## 학력");
          lines.push("");
          for (const entry of education) {
            lines.push(`### ${entry.institution}`);
            lines.push(
              `${entry.degree} · ${entry.field}${entry.gpa ? ` · GPA ${entry.gpa}` : ""} | ${formatDate(entry.startDate)} ~ ${formatDate(entry.endDate)}`
            );
            if (entry.achievements.length > 0) {
              lines.push("");
              for (const ach of entry.achievements) {
                lines.push(`- ${ach}`);
              }
            }
            lines.push("");
          }
        }
        break;
      }

      case "skills": {
        const hasSkills =
          skills.technical.length > 0 ||
          (skills.languages && skills.languages.length > 0) ||
          (skills.certifications && skills.certifications.length > 0);

        if (hasSkills) {
          lines.push("## 기술 스택");
          lines.push("");
          for (const group of skills.technical) {
            lines.push(`**${group.category}**: ${group.items.join(", ")}`);
          }
          if (skills.languages && skills.languages.length > 0) {
            lines.push(`**어학**: ${skills.languages.join(", ")}`);
          }
          if (skills.certifications && skills.certifications.length > 0) {
            lines.push(`**자격증**: ${skills.certifications.join(", ")}`);
          }
          lines.push("");
        }
        break;
      }
    }
  }

  return lines.join("\n").trim();
}
