"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import type { ChatMessage } from "@/stores/chat-store";

// 스트리밍 커서 애니메이션 컴포넌트
function StreamingCursor() {
  return (
    <span
      className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle"
      aria-hidden="true"
    />
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      aria-label={isUser ? "내 메시지" : "AI 응답"}
    >
      {/* 아바타 */}
      {!isUser && (
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-hidden="true"
        >
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* 말풍선 */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.isStreaming && <StreamingCursor />}
      </div>
    </article>
  );
}

// 빈 상태 안내
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">
          AI 커리어 코치와 대화를 시작하세요
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          경험을 자유롭게 이야기해 주세요.
          <br />
          AI가 이력서에 맞게 재구성해 드립니다.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-left">
        {[
          "저는 3년차 프론트엔드 개발자입니다.",
          "이커머스 회사에서 결제 시스템을 개선했어요.",
          "React와 TypeScript를 주로 사용합니다.",
        ].map((example) => (
          <p
            key={example}
            className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
          >
            &ldquo;{example}&rdquo;
          </p>
        ))}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { messages, isStreaming, addMessage, appendToMessage, finishStreaming, getApiMessages } =
    useChatStore();
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

  // SSE 스트리밍으로 메시지 전송
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const trimmed = content.trim();

      // addMessage 전에 스냅샷 저장 — 중복 전송 방지
      const priorMessages = getApiMessages();

      // 사용자 메시지 추가
      addMessage({ role: "user", content: trimmed });
      setInput("");

      // 스트리밍 AI 메시지 placeholder 추가
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
          // 마지막 불완전한 라인은 buffer에 유지
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data) as { text?: string; error?: string };
                // SSE error 이벤트 처리
                if (parsed.error) {
                  appendToMessage(assistantId, `오류가 발생했습니다: ${parsed.error}`);
                } else if (parsed.text) {
                  appendToMessage(assistantId, parsed.text);
                }
              } catch {
                // JSON 파싱 실패 시 무시
              }
            }
          }
        }
      } catch (err) {
        // AbortError는 정상 취소이므로 무시
        if (err instanceof Error && err.name === "AbortError") return;
        const errorMessage =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
        appendToMessage(assistantId, `\n\n오류: ${errorMessage}`);
      } finally {
        finishStreaming(assistantId);
      }
    },
    [isStreaming, addMessage, appendToMessage, finishStreaming, getApiMessages]
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
      // Enter 전송, Shift+Enter 줄바꿈
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  return (
    <aside
      className="flex h-full flex-col"
      aria-label="AI 채팅 패널"
    >
      {/* 헤더 */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI 커리어 코치</h2>
            <p className="text-xs text-muted-foreground">경험을 이야기하면 이력서로 만들어 드립니다</p>
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex flex-1 flex-col overflow-y-auto" role="log" aria-live="polite" aria-label="채팅 메시지">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 폼 */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            style={{ minHeight: "48px", maxHeight: "160px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="메시지 전송"
          >
            {isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Enter로 전송, Shift+Enter로 줄바꿈
        </p>
      </div>
    </aside>
  );
}
