import Anthropic from "@anthropic-ai/sdk";

// 서버 사이드 전용 — API 키는 절대 클라이언트 번들에 포함되지 않음
if (typeof window !== "undefined") {
  throw new Error("Claude client는 서버 사이드에서만 사용할 수 있습니다");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-5" as const;
export const MAX_TOKENS = 4096 as const;
