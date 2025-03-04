// lib/chat-config.ts

// Configure your chat backend settings here
export const CHAT_CONFIG = {
    // Base URL of your backend API (can be overridden by environment variable)
    apiBaseUrl: process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:8000',

    // Endpoints
    endpoints: {
        message: '/chat/message',
        history: '/chat/history',
    },

    // Feature flags
    features: {
        enableHistory: true,
        enableFileUpload: false,
        enableVoiceInput: false,
    },

    // UI configuration
    ui: {
        initialMessage: "Hello! I'm the AI assistant. How can I help you today?",
        loadingMessage: "Thinking...",
        errorMessage: "Sorry, I encountered an error. Please try again later.",
        avatars: {
            ai: "🤖",
            human: "👨🏽",
        },
    },
};