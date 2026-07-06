"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import type { ChatMessage } from "@/stores/chat-store";
import { useResumeStore } from "@/stores/resume-store";
import { useDiffStore } from "@/stores/diff-store";
import type { CoreCompetency, StarHighlight } from "@/types/resume";

// SSE 이벤트 유니온 타입
type SseEvent =
  | { text: string }
  | { error: string }
  | { type: "tool_call"; name: string; input: unknown }
  | { type: "tool_done"; sections: string[] };

// 스트리밍 커서: | 문자 blink 0.8s
function StreamingCursor() {
  return (
    <span
      className="ml-0.5 inline-block h-[1em] w-px bg-current align-middle streaming-cursor"
      aria-hidden="true"
    >
      |
    </span>
  );
}

// 생각 중 dots bounce 애니메이션
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3" aria-label="AI 생각 중">
      <span
        className="h-2 w-2 rounded-full bg-text-muted"
        style={{ animation: "thinking-dot 1.2s ease 0ms infinite" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-text-muted"
        style={{ animation: "thinking-dot 1.2s ease 200ms infinite" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-text-muted"
        style={{ animation: "thinking-dot 1.2s ease 400ms infinite" }}
      />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isEmpty = message.isStreaming && message.content === "";

  return (
    <article
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      aria-label={isUser ? "내 메시지" : "AI 응답"}
    >
      {/* AI 아바타 */}
      {!isUser && (
        <div
          className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full gradient-button text-white text-[11px] font-bold"
          aria-hidden="true"
        >
          AI
        </div>
      )}

      {/* 말풍선 */}
      <div className={`max-w-[78%] ${isUser ? "" : ""}`}>
        {!isUser && (
          <div className="mb-1 text-[11px] font-semibold text-text-muted">
            어시스턴트
          </div>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? "rounded-tr-sm gradient-button text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)]"
              : "rounded-tl-sm border border-border bg-surface-2 text-foreground"
          }`}
        >
          {isEmpty ? (
            <ThinkingDots />
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.isStreaming && <StreamingCursor />}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

// 퀵 액션 버튼 예시 메시지
const QUICK_ACTIONS = [
  "자기소개를 더 임팩트있게 수정해줘",
  "경력 기술서를 수치화해줘",
  "JD와 매칭되는 부분 분석해줘",
];

interface EmptyStateProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

function EmptyState({ onSend, disabled }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-button text-white text-lg font-bold">
        AI
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[14px] font-semibold text-foreground">
          대화를 시작하세요
        </h3>
        <p className="text-[12px] leading-relaxed text-text-muted">
          경험을 자유롭게 이야기하면
          <br />
          이력서 형태로 정리해 드립니다.
        </p>
      </div>
      {/* 퀵 액션 제안 */}
      <div className="flex w-full max-w-[260px] flex-col gap-2">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          제안
        </div>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            disabled={disabled}
            onClick={() => onSend(action)}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-left text-[12px] text-text-muted transition-all hover:border-accent-brand/30 hover:bg-surface-3 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { messages, isStreaming, addMessage, appendToMessage, finishStreaming, getApiMessages } =
    useChatStore();
  const resumeStore = useResumeStore();
  const { triggerDiff } = useDiffStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 언마운트 시 스트리밍 fetch 중단용 AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // 언마운트 시 진행 중인 스트리밍 정리
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // textarea 자동 높이 조절
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Tool 호출을 resume store에 적용
  const applyToolCall = useCallback(
    (name: string, input: unknown): void => {
      const inp = input as Record<string, unknown>;
      switch (name) {
        case "update_brief_intro":
          resumeStore.updateBriefIntro(inp.text as string, true);
          break;
        case "update_personal_info":
          resumeStore.updatePersonalInfo(inp as Parameters<typeof resumeStore.updatePersonalInfo>[0]);
          break;
        case "update_core_competencies":
          resumeStore.updateCoreCompetencies(inp.items as Array<CoreCompetency>);
          break;
        case "add_experience":
          resumeStore.addExperience(
            inp as unknown as Parameters<typeof resumeStore.addExperience>[0]
          );
          break;
        case "update_experience_highlights":
          resumeStore.updateExperienceHighlights(
            inp.experienceId as string,
            inp.highlights as Array<StarHighlight>
          );
          break;
        default:
          // 알 수 없는 tool 이름은 무시
          break;
      }
    },
    [resumeStore]
  );

  // SSE 스트리밍으로 메시지 전송
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const trimmed = content.trim();

      // addMessage 전에 스냅샷 저장 — 중복 전송 방지
      const priorMessages = getApiMessages();

      addMessage({ role: "user", content: trimmed });
      setInput("");

      const assistantId = addMessage({
        role: "assistant",
        content: "",
        isStreaming: true,
      });

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            messages: [...priorMessages, { role: "user" as const, content: trimmed }],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("응답 스트림을 읽을 수 없습니다.");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data) as SseEvent;
                if ("error" in parsed) {
                  // 기존 에러 처리
                  appendToMessage(assistantId, `오류가 발생했습니다: ${parsed.error}`);
                } else if ("text" in parsed) {
                  // 기존 텍스트 스트리밍 처리
                  appendToMessage(assistantId, parsed.text);
                } else if (parsed.type === "tool_call") {
                  // Tool 호출 처리 — resume store 업데이트
                  applyToolCall(parsed.name, parsed.input);
                } else if (parsed.type === "tool_done") {
                  // Diff 하이라이트 트리거
                  triggerDiff(parsed.sections);
                }
              } catch {
                // JSON 파싱 실패 무시
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorMessage =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
        appendToMessage(assistantId, `\n\n오류: ${errorMessage}`);
      } finally {
        finishStreaming(assistantId);
      }
    },
    [isStreaming, addMessage, appendToMessage, finishStreaming, getApiMessages, applyToolCall, triggerDiff]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  return (
    <aside className="flex h-full flex-col" aria-label="AI 채팅 패널">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          대화
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
          <span className="text-[11px] text-text-muted">연결됨</span>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div
        className="flex flex-1 flex-col overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="채팅 메시지"
      >
        {messages.length === 0 ? (
          <EmptyState onSend={sendMessage} disabled={isStreaming} />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 폼 */}
      <div className="border-t border-border p-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            메시지 입력
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="경험을 자유롭게 이야기해 주세요..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none bg-transparent py-1 text-[13px] text-foreground placeholder:text-text-muted focus:outline-none disabled:opacity-50"
            style={{ minHeight: "28px", maxHeight: "160px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg gradient-button text-white transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="메시지 전송"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[11px] text-text-muted">
          Enter로 전송 · Shift+Enter 줄바꿈
        </p>
      </div>
    </aside>
  );
}
