import { type NextRequest } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";

// POST /api/rewrite
// Body: { text: string; mode: "stronger" | "concise" | "star" }
// Response: text/event-stream — data: { text: string } 청크, data: [DONE]

const SYSTEM_PROMPT = `당신은 한국어 이력서 문장 전문 편집자입니다.
주어진 텍스트를 요청된 방식으로 개선하세요.
- 원문의 핵심 내용과 사실은 절대 바꾸지 말 것
- 수치/결과가 있으면 반드시 유지할 것
- 한국어로 작성할 것
- 개선된 문장만 출력하고 설명은 붙이지 말 것`;

const MODE_PROMPTS: Record<string, string> = {
  stronger: "아래 문장을 더 강렬하고 임팩트 있게 수정해주세요. 동사를 강하게, 결과를 구체적으로.",
  concise: "아래 문장을 더 간결하게 다듬어주세요. 불필요한 수식어를 제거하고 핵심만 남기세요.",
  star: "아래 내용을 STAR 기법(Situation-Task-Action-Result)으로 재구성해주세요. 한 문장으로 결과를 강조해 작성하세요.",
};

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "CONFIGURATION_ERROR", message: "API 키가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  let text: string;
  let mode: string;

  try {
    const body = await request.json() as { text: string; mode: string };
    text = body.text?.trim();
    mode = body.mode ?? "stronger";
    if (!text) throw new Error("text is required");
  } catch {
    return Response.json({ error: "INVALID_REQUEST", message: "올바른 요청이 아닙니다" }, { status: 400 });
  }

  const modePrompt = MODE_PROMPTS[mode] ?? MODE_PROMPTS.stronger;
  const userMessage = `${modePrompt}\n\n---\n${text}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ text: chunk.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "알 수 없는 오류";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
