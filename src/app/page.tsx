"use client";

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";
import {
  CopyIcon,
  CornerDownLeft,
  Mic,
  Paperclip,
  RefreshCcw,
  Send,
  Volume2,
} from "lucide-react";
import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeDisplayBlock from "@/components/code-display-block";

const ChatAiIcons = [
  {
    icon: CopyIcon,
    label: "Copy",
  },
  {
    icon: RefreshCcw,
    label: "Refresh",
  },
  {
    icon: Volume2,
    label: "Volume",
  },
];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/chat";

export default function Home() {
  const [messages, setMessages] = useState<
      { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const threadId = "213123888"; // O genera un ID único para cada sesión

  // Cargar historial de chat al montar el componente
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`${API_URL}/history/${threadId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    }
    fetchHistory();
  }, [threadId]);

  // Ajuste del scroll cuando cambian los mensajes
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Función para enviar el mensaje al backend
  const sendMessage = async (msg: string) => {
    setIsGenerating(true);
    // Agregar mensaje del usuario
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    try {
      const res = await fetch(`${API_URL}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          thread_id: threadId,
          reset_thread: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Agregar respuesta de la IA
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      } else {
        console.error("Error en el response:", res.statusText);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating || !input.trim()) return;
      sendMessage(input);
      setInput("");
    }
  };

  // Ejemplo de acción para copiar contenido
  const handleActionClick = (action: string, messageIndex: number) => {
    if (action === "Copy") {
      const message = messages[messageIndex];
      if (message && message.role === "assistant") {
        navigator.clipboard.writeText(message.content);
      }
    }
  };

  return (
      <main className="flex h-screen w-full max-w-3xl flex-col items-center mx-auto">
        <div className="flex-1 w-full overflow-y-auto py-6">
          <ChatMessageList ref={messagesRef}>
            {/* Mensajes del chat */}
            {messages.map((message, index) => (
                <ChatBubble
                    key={index}
                    variant={message.role === "user" ? "sent" : "received"}
                >
                  <ChatBubbleAvatar
                      fallback={message.role === "user" ? "👨🏽" : "🤖"}
                  />
                  <ChatBubbleMessage>
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </Markdown>
                    {message.role === "assistant" && index === messages.length - 1 && (
                        <div className="flex items-center mt-1.5 gap-1">
                          {!isGenerating &&
                              ChatAiIcons.map((icon, iconIndex) => {
                                const Icon = icon.icon;
                                return (
                                    <ChatBubbleAction
                                        variant="outline"
                                        className="size-5"
                                        key={iconIndex}
                                        icon={<Icon className="size-3" />}
                                        onClick={() =>
                                            handleActionClick(icon.label, index)
                                        }
                                    />
                                );
                              })}
                        </div>
                    )}
                  </ChatBubbleMessage>
                </ChatBubble>
            ))}
            {isGenerating && (
                <ChatBubble variant="received">
                  <ChatBubbleAvatar fallback="🤖"/>
                  <ChatBubbleMessage isLoading/>
                </ChatBubble>
            )}
          </ChatMessageList>
        </div>
        <div className="w-full px-4 pb-4">
          <form ref={formRef} onSubmit={onSubmit}
                className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring">
            <ChatInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Escriba su mensaje aquí..."
                className="rounded-lg bg-background border-0 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0">
              <Button variant="ghost" size="icon">
                <Paperclip className="size-4"/>
                <span className="sr-only">Attach file</span>
              </Button>
              <Button variant="ghost" size="icon">
                <Mic className="size-4"/>
                <span className="sr-only">Use Microphone</span>
              </Button>
              <Button
                  disabled={!input.trim() || isGenerating}
                  type="submit"
                  size="sm"
                  className="ml-auto gap-1.5"
              >
                Enviar Mensaje
                <CornerDownLeft className="size-3.5"/>
              </Button>
            </div>
          </form>
        </div>
      </main>
  );
}
