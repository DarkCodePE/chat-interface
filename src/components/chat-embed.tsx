"use client";

import { useEffect, useRef, useState } from "react";
import {
    ChatBubble,
    ChatBubbleAvatar,
    ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import {
    ExpandableChat,
    ExpandableChatHeader,
    ExpandableChatBody,
    ExpandableChatFooter,
} from "@/components/ui/chat/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "./ui/button";
import { Send, AlertTriangle } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeDisplayBlock from "./code-display-block";
import { v4 as uuidv4 } from "uuid";

// Define types to match your backend
interface ChatMessage {
    role: string;
    content: string;
}

interface ChatHistoryResponse {
    thread_id: string;
    messages: ChatMessage[];
}

interface ChatRequestBody {
    message: string;
    thread_id: string;
    reset_thread: boolean;
}

interface ChatResponseBody {
    thread_id: string;
    message: string;
    answer: string;
    error?: string;
}

// Dynamically get the API URL from a data attribute or environment variable
const getApiUrl = () => {
    // Check if we're in a browser context
    if (typeof window !== 'undefined') {
        // Try to get URL from script data attribute
        const scriptTag = document.querySelector('script[data-chat-api]');
        if (scriptTag) {
            const apiUrl = scriptTag.getAttribute('data-chat-api');
            if (apiUrl) return apiUrl;
        }
    }

    // Fallback to environment variable
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/chat";
};

export default function ChatEmbed() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "ai",
            content: "¡Hola! Soy tu asistente virtual. ¿En qué te puedo ayudar con tu revisión técnica?",
        },
    ]);
    const [input, setInput] = useState("");
    const [threadId, setThreadId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [apiUrl, setApiUrl] = useState<string>("");

    const messagesRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Initialize API URL and thread ID on component mount
    useEffect(() => {
        setApiUrl(getApiUrl());

        const storedThreadId = localStorage.getItem("chatThreadId");
        if (storedThreadId) {
            setThreadId(storedThreadId);
            // Load chat history for this thread
            fetchChatHistory(storedThreadId);
        } else {
            const newThreadId = uuidv4();
            setThreadId(newThreadId);
            localStorage.setItem("chatThreadId", newThreadId);
        }

        // Listen for messages from parent window
        window.addEventListener('message', handleParentMessage);

        return () => {
            window.removeEventListener('message', handleParentMessage);
        };
    }, []);

    // Handle messages from parent window
    const handleParentMessage = (event: MessageEvent) => {
        // Check origin for security
        // if (event.origin !== 'https://allowed-parent-domain.com') return;

        const { type, data } = event.data;

        switch (type) {
            case 'CHAT_EXPANDED':
                // Handle expanded state in the parent
                break;
            case 'CHAT_COLLAPSED':
                // Handle collapsed state in the parent
                break;
            case 'SEND_MESSAGE':
                if (data?.message) {
                    handleSendMessage(data.message);
                }
                break;
        }
    };

    // Send a message to parent window
    const notifyParent = (type: string, data?: any) => {
        if (window.parent) {
            window.parent.postMessage({ type, data }, '*');
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    // Function to fetch chat history
    const fetchChatHistory = async (tid: string) => {
        try {
            setError(null);

            const response = await fetch(`${apiUrl}/history/${tid}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch chat history: ${errorText}`);
                throw new Error("Failed to fetch chat history");
            }

            const data: ChatHistoryResponse = await response.json();

            // If we have messages, update the state
            if (data.messages && data.messages.length > 0) {
                setMessages([
                    {
                        role: "ai",
                        content: "¡Hola! Soy tu asistente virtual. ¿En qué te puedo ayudar con tu revisión técnica?",
                    },
                    ...data.messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                ]);
            }
        } catch (err) {
            console.error("Error fetching chat history:", err);
            setError("Failed to load chat history");
        }
    };

    // Function to send a message to the backend
    const sendMessage = async (message: string) => {
        try {
            setError(null);

            const requestBody: ChatRequestBody = {
                message,
                thread_id: threadId,
                reset_thread: false,
            };

            const response = await fetch(`${apiUrl}/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to send message: ${errorText}`);
                throw new Error("Failed to send message");
            }

            const data: ChatResponseBody = await response.json();

            // Notify parent window about the new message
            notifyParent('NEW_MESSAGE', {
                role: 'ai',
                content: data.answer
            });

            return data;
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to get a response");
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle form submission
    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!input.trim() || isGenerating) return;

        await handleSendMessage(input.trim());
        setInput("");
    };

    // Handle sending a message (used by form submit and API)
    const handleSendMessage = async (message: string) => {
        if (!message.trim() || isGenerating) return;

        // Add user message to messages immediately
        const userMessage = message.trim();
        setMessages((prevMessages) => [
            ...prevMessages,
            { role: "human", content: userMessage },
        ]);

        // Notify parent window about the new message
        notifyParent('NEW_MESSAGE', {
            role: 'human',
            content: userMessage
        });

        // Set loading state
        setIsGenerating(true);

        // Send message to backend
        const response = await sendMessage(userMessage);

        if (response) {
            // Add AI response to messages
            setMessages((prevMessages) => [
                ...prevMessages,
                { role: "ai", content: response.answer },
            ]);
        }
    };

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    // Handle keyboard shortcuts
    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (isGenerating || !input.trim()) return;
            formRef.current?.requestSubmit();
        }
    };

    // Start a new chat
    const startNewChat = () => {
        const newThreadId = uuidv4();
        setThreadId(newThreadId);
        localStorage.setItem("chatThreadId", newThreadId);
        setMessages([
            {
                role: "ai",
                content: "¡Hola! Soy tu asistente virtual. ¿En qué te puedo ayudar con tu revisión técnica?",
            },
        ]);
        setError(null);

        // Notify parent window about the new chat
        notifyParent('NEW_CHAT', { thread_id: newThreadId });
    };

    return (
        <ExpandableChat size="md" position="bottom-right">
            <ExpandableChatHeader className="bg-muted/60 flex-col text-center justify-center">
                <h1 className="text-xl font-semibold">🔧Asesor Virtual de Revisiones Técnicas🚗</h1>
                <div className="flex gap-2 items-center pt-2">
                    <Button variant="secondary" onClick={startNewChat}>
                        Nueva Consulta
                    </Button>
                    <Button variant="secondary">Ver Requisitos</Button>
                </div>
            </ExpandableChatHeader>
            <ExpandableChatBody>
                <ChatMessageList className="bg-muted/25" ref={messagesRef}>
                    {/* Messages */}
                    {messages.map((message, index) => (
                        <ChatBubble
                            key={index}
                            variant={message.role === "human" ? "sent" : "received"}
                        >
                            <ChatBubbleAvatar
                                src=""
                                fallback={message.role === "human" ? "👨🏽" : "🤖"}
                            />
                            <ChatBubbleMessage
                                variant={message.role === "human" ? "sent" : "received"}
                            >
                                {message.content
                                    .split("```")
                                    .map((part: string, i: number) => {
                                        if (i % 2 === 0) {
                                            return (
                                                <Markdown key={i} remarkPlugins={[remarkGfm]}>
                                                    {part}
                                                </Markdown>
                                            );
                                        } else {
                                            return (
                                                <pre className="pt-2" key={i}>
                                                    <CodeDisplayBlock code={part} lang="" />
                                                </pre>
                                            );
                                        }
                                    })}
                            </ChatBubbleMessage>
                        </ChatBubble>
                    ))}

                    {/* Error message if any */}
                    {error && (
                        <ChatBubble variant="received">
                            <ChatBubbleAvatar src="" fallback="⚠️" />
                            <ChatBubbleMessage variant="received">
                                <div className="text-destructive flex items-center gap-2">
                                    <AlertTriangle className="size-4" />
                                    <span>Error: {error}</span>
                                </div>
                            </ChatBubbleMessage>
                        </ChatBubble>
                    )}

                    {/* Loading indicator */}
                    {isGenerating && (
                        <ChatBubble variant="received">
                            <ChatBubbleAvatar src="" fallback="🤖" />
                            <ChatBubbleMessage isLoading />
                        </ChatBubble>
                    )}
                </ChatMessageList>
            </ExpandableChatBody>
            <ExpandableChatFooter className="bg-muted/25">
                <form ref={formRef} className="flex relative gap-2" onSubmit={onSubmit}>
                    <ChatInput
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={onKeyDown}
                        className="min-h-12 bg-background shadow-none"
                        placeholder="Escribe tu mensaje aquí..."
                    />
                    <Button
                        className="absolute top-1/2 right-2 transform -translate-y-1/2"
                        type="submit"
                        size="icon"
                        disabled={isGenerating || !input.trim()}
                    >
                        <Send className="size-4" />
                    </Button>
                </form>
            </ExpandableChatFooter>
        </ExpandableChat>
    );
}