import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";

// Auth.js v5 — GitHub OAuth + DB 세션(Drizzle 어댑터)
// 필요 환경변수: AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET (docs/db.md 참고)
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [GitHub],
  session: { strategy: "database" },
  callbacks: {
    // API 라우트에서 세션으로 사용자를 식별할 수 있게 user.id 노출
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
