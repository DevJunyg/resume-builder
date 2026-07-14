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
  let resumeSnapshot: string | null = null;

  try {
    const body = await request.json();
    messages = body.messages;
    // 현재 이력서 상태 — AI가 기존 항목의 실제 ID를 참조해 수정/삭제할 수 있게 함
    if (body.resume && typeof body.resume === "object") {
      // 토큰 절약: 렌더링 전용 필드 제외, 과대 입력 방어를 위해 길이 제한
      const json = JSON.stringify(body.resume, (key, value) =>
        key === "sections" || key === "metadata" || key === "isJdHighlighted"
          ? undefined
          : value
      );
      resumeSnapshot = json.length > 20000 ? json.slice(0, 20000) + "…(생략)" : json;
    }
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

  // 시스템 프롬프트: 고정 지침 + (있으면) 현재 이력서 상태
  // 배열 형태로 분리해 두면 나중에 고정 블록에만 prompt caching을 걸 수 있다
  const systemBlocks: Anthropic.TextBlockParam[] = [
    { type: "text", text: RESUME_SYSTEM_PROMPT },
  ];
  if (resumeSnapshot) {
    systemBlocks.push({
      type: "text",
      text: `## 현재 이력서 상태 (JSON)\n수정/삭제 tool 호출 시 반드시 아래의 실제 id 값을 사용하세요. ID를 지어내지 마세요.\n${resumeSnapshot}`,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      // SSE JSON 이벤트 전송 헬퍼
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        // 에이전트 루프 — 모델이 tool 호출을 멈출 때까지 여러 라운드 반복.
        // (기존엔 1라운드 + follow-up 1회만 처리해서, 2번째 라운드 이후의 tool 호출이
        //  전부 무시됐다. 그 탓에 모델이 "이제 추가하겠습니다"라고 말만 하고 실제
        //  경력 하이라이트/스킬/학력 등은 반영되지 않는 버그가 있었다.)
        let conversation: Anthropic.MessageParam[] = messages;
        const MAX_ROUNDS = 10; // 무한 루프 방지 안전장치

        for (let round = 0; round < MAX_ROUNDS; round++) {
          const roundStream = anthropic.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: MAX_TOKENS,
            // 빠른 응답 유지 — thinking 없이 즉시 스트리밍 (Sonnet 5는 기본이 adaptive)
            thinking: { type: "disabled" },
            system: systemBlocks,
            tools: RESUME_TOOLS,
            messages: conversation,
          });

          // 이번 라운드의 텍스트 청크를 실시간 전송
          for await (const event of roundStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send({ text: event.delta.text });
            }
          }

          const finalMessage = await roundStream.finalMessage();

          // tool 호출이 없으면 대화 종료
          if (finalMessage.stop_reason !== "tool_use") break;

          // 이번 라운드의 tool_use 블록: 프론트에 emit + tool_result 준비
          const toolResults: Array<{
            type: "tool_result";
            tool_use_id: string;
            content: string;
          }> = [];

          for (const block of finalMessage.content) {
            if (block.type === "tool_use") {
              // 프론트엔드가 이력서 상태를 업데이트하는 데 사용
              send({ type: "tool_call", name: block.name, input: block.input });
              // diff 하이라이트 트리거용 섹션 정보
              send({ type: "tool_done", sections: TOOL_SECTION_MAP[block.name] ?? [] });

              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: "성공적으로 업데이트했습니다.",
              });
            }
          }

          // 다음 라운드로 대화를 이어붙임 (assistant tool_use + user tool_result)
          conversation = [
            ...conversation,
            { role: "assistant", content: finalMessage.content },
            { role: "user", content: toolResults },
          ];
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
