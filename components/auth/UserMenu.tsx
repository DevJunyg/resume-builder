"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut, Cloud, CloudOff, Loader2 } from "lucide-react";
import type { CloudSyncStatus } from "@/lib/use-cloud-sync";

// 동기화 상태 뱃지 문구/아이콘
function SyncBadge({ status }: { status: CloudSyncStatus }) {
  if (status === "local") return null;
  const label =
    status === "loading"
      ? "불러오는 중"
      : status === "saving"
        ? "저장 중"
        : status === "error"
          ? "저장 실패"
          : "저장됨";
  const Icon =
    status === "loading" || status === "saving"
      ? Loader2
      : status === "error"
        ? CloudOff
        : Cloud;
  return (
    <span
      className={`flex items-center gap-1 text-[11px] ${
        status === "error" ? "text-red-400" : "text-text-muted"
      }`}
      title={status === "error" ? "클라우드 저장에 실패했습니다. 변경 시 자동 재시도합니다." : undefined}
    >
      <Icon
        className={`h-3 w-3 ${status === "loading" || status === "saving" ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function UserMenu({ syncStatus }: { syncStatus: CloudSyncStatus }) {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("github")}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-accent-brand/40 hover:bg-surface-2"
        title="로그인하면 이력서가 클라우드에 저장됩니다"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
        GitHub 로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <SyncBadge status={syncStatus} />
      <span className="max-w-[120px] truncate text-[12px] text-text-muted">
        {session.user.name ?? session.user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        aria-label="로그아웃"
        title="로그아웃"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
