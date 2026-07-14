"use client";

import { SessionProvider } from "next-auth/react";

// next-auth useSession()을 클라이언트 트리에서 쓰기 위한 래퍼
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
