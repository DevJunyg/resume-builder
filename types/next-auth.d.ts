import type { DefaultSession } from "next-auth";

// session.user.id 타입 확장 (auth.ts의 session 콜백에서 주입)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
