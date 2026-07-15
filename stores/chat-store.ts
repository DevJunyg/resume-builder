import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => string;
  appendToMessage: (id: string, text: string) => void;
  finishStreaming: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  getApiMessages: () => Array<{ role: "user" | "assistant"; content: string }>;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      streamingMessageId: null,

      addMessage: (message) => {
        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newMessage: ChatMessage = {
          ...message,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
          isStreaming: message.isStreaming ?? false,
          streamingMessageId: message.isStreaming
            ? id
            : state.streamingMessageId,
        }));
        return id;
      },

      appendToMessage: (id, text) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + text } : m
          ),
        })),

      finishStreaming: (id) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, isStreaming: false } : m
          ),
          isStreaming: false,
          streamingMessageId: null,
        })),

      // 서버에서 불러온 대화 내역으로 전체 교체 (활성 이력서 전환 시 사용)
      setMessages: (messages) =>
        set({ messages, isStreaming: false, streamingMessageId: null }),

      clearMessages: () =>
        set({ messages: [], isStreaming: false, streamingMessageId: null }),

      getApiMessages: () =>
        get()
          .messages.filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content })),
    }),
    { name: "chat-store" }
  )
);
