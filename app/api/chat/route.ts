import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL, MAX_TOKENS } from "@/lib/claude/client";
import { RESUME_SYSTEM_PROMPT } from "@/lib/claude/prompts";

// POST /api/chat
// Body: { messages: Anthropic.MessageParam[], system?: string }
// Response: text/event-stream (SSE)
//   data: { text: string }     — 스트리밍 텍스트 청크
//   data: [DONE]               — 스트리밍 종료
//   data: { error: string }    — 스트리밍 중 오류

export async function POST(request: NextRequest) {
  // API 키 미설정 시 즉시 에러 반환
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "CONFIGURATION_ERROR", message: "API 키가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  let messages: Anthropic.MessageParam[];

  try {
    const body = await request.json();
    messages = body.messages;
  } catch {
    return Response.json(
      { error: "INVALID_JSON", message: "요청 본문을 파싱할 수 없습니다" },
      { status: 400 }
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "INVALID_REQUEST", message: "messages 배열이 비어있습니다" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: RESUME_SYSTEM_PROMPT,
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "스트리밍 오류";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
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
