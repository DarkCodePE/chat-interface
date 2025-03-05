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
const API_URL = "http://localhost:8000/chat";
export default function ChatSupport() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "ai",
            content: "Hello! I'm the AI assistant. How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [threadId, setThreadId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const messagesRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Initialize thread ID on component mount
    useEffect(() => {
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
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    // Debug log to track state changes
    useEffect(() => {
        console.log(`Current thread ID: ${threadId}`);
    }, [threadId]);

    // Function to fetch chat history
    const fetchChatHistory = async (tid: string) => {
        try {
            setError(null);
            console.log(`Fetching chat history for thread: ${tid}`);

            const response = await  fetch(`${API_URL}/history/${tid}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch chat history: ${errorText}`);
                throw new Error("Failed to fetch chat history");
            }

            const data: ChatHistoryResponse = await response.json();
            console.log('Received history:', data);

            // If we have messages, update the state
            if (data.messages && data.messages.length > 0) {
                setMessages([
                    {
                        role: "ai",
                        content: "Hello! I'm the AI assistant. How can I help you today?",
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
            console.log(`Sending message to thread ${threadId}: ${message}`);

            const requestBody: ChatRequestBody = {
                message,
                thread_id: threadId,
                reset_thread: false,
            };

            console.log('Request payload:', requestBody);

            const response = await fetch(`${API_URL}/message`, {
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
            console.log("Received response:", data);

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

        // Add user message to messages immediately
        const userMessage = input.trim();
        setMessages((prevMessages) => [
            ...prevMessages,
            { role: "human", content: userMessage },
        ]);

        // Clear input and set loading state
        setInput("");
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
        console.log(`Starting new chat with thread ID: ${newThreadId}`);
        setThreadId(newThreadId);
        localStorage.setItem("chatThreadId", newThreadId);
        setMessages([
            {
                role: "ai",
                content: "Hello! I'm the AI assistant. How can I help you today?",
            },
        ]);
        setError(null);
    };

    return (
        <ExpandableChat size="md" position="bottom-right">
            <ExpandableChatHeader className="bg-muted/60 flex-col text-center justify-center">
                <h1 className="text-xl font-semibold">Chat with our AI ✨</h1>
                <p>Ask any question for our AI to answer</p>
                <div className="flex gap-2 items-center pt-2">
                    <Button variant="secondary" onClick={startNewChat}>
                        New Chat
                    </Button>
                    <Button variant="secondary">See FAQ</Button>
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
                        placeholder="Type your message..."
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