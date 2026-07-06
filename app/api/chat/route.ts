import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL, MAX_TOKENS } from "@/lib/claude/client";
import { RESUME_SYSTEM_PROMPT } from "@/lib/claude/prompts";
import { RESUME_TOOLS, TOOL_SECTION_MAP } from "@/lib/claude/tools";

// Vercel 함수 최대 실행 시간 (스트리밍 대화용)
export const maxDuration = 60;

// POST /api/chat
// Body: { messages: Anthropic.MessageParam[] }
// Response: text/event-stream (SSE)
//   data: { text: string }                                       — 스트리밍 텍스트 청크
//   data: { type: "tool_call", name: string, input: unknown }    — Claude tool 호출 완료
//   data: { type: "tool_done", sections: string[] }             — tool 처리 완료 (diff 트리거)
//   data: [DONE]                                                 — 스트리밍 종료
//   data: { error: string }                                      — 스트리밍 중 오류

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
          // 빠른 응답 유지 — thinking 없이 즉시 스트리밍 (Sonnet 5는 기본이 adaptive)
          thinking: { type: "disabled" },
          system: RESUME_SYSTEM_PROMPT,
          tools: RESUME_TOOLS,
          messages,
        });

        // 스트리밍 중 텍스트 청크를 실시간으로 전송
        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        // 스트림 완료 후 최종 메시지 확인 (tool_use 여부 판단)
        const finalMessage = await anthropicStream.finalMessage();

        if (finalMessage.stop_reason === "tool_use") {
          // tool_use 블록을 추출해 SSE 이벤트로 emit하고 후속 대화 처리
          const toolCalls: Array<{
            id: string;
            name: string;
            input: unknown;
          }> = [];

          for (const block of finalMessage.content) {
            if (block.type === "tool_use") {
              // tool_call 이벤트 emit — 프론트엔드가 이력서 상태를 업데이트하는 데 사용
              const toolCallChunk = `data: ${JSON.stringify({
                type: "tool_call",
                name: block.name,
                input: block.input,
              })}\n\n`;
              controller.enqueue(encoder.encode(toolCallChunk));

              toolCalls.push({
                id: block.id,
                name: block.name,
                input: block.input,
              });

              // tool_done 이벤트 emit — diff 하이라이트 트리거용 섹션 정보 포함
              const sections = TOOL_SECTION_MAP[block.name] ?? [];
              const toolDoneChunk = `data: ${JSON.stringify({
                type: "tool_done",
                sections,
              })}\n\n`;
              controller.enqueue(encoder.encode(toolDoneChunk));
            }
          }

          // tool_result 메시지로 후속 대화를 이어 Claude가 변경 내용을 설명하게 함
          if (toolCalls.length > 0) {
            const followUpMessages: Anthropic.MessageParam[] = [
              ...messages,
              { role: "assistant", content: finalMessage.content },
              {
                role: "user",
                content: toolCalls.map((tc) => ({
                  type: "tool_result" as const,
                  tool_use_id: tc.id,
                  content: "성공적으로 업데이트했습니다.",
                })),
              },
            ];

            const followUpStream = anthropic.messages.stream({
              model: CLAUDE_MODEL,
              max_tokens: MAX_TOKENS,
              thinking: { type: "disabled" },
              system: RESUME_SYSTEM_PROMPT,
              tools: RESUME_TOOLS,
              messages: followUpMessages,
            });

            // 후속 스트림의 텍스트 청크를 동일하게 emit
            for await (const followEvent of followUpStream) {
              if (
                followEvent.type === "content_block_delta" &&
                followEvent.delta.type === "text_delta"
              ) {
                const chunk = `data: ${JSON.stringify({ text: followEvent.delta.text })}\n\n`;
                controller.enqueue(encoder.encode(chunk));
              }
            }
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
