// src/app/embed/page.tsx
"use client";

import React, { useEffect } from 'react';
import ChatRevision from '@/components/chat-revision';
import { ThemeProvider } from "@/components/theme-provider";

export default function EmbedPage() {
    useEffect(() => {
        // Notify parent window that chat is ready
        if (window.parent) {
            window.parent.postMessage({ type: 'CHAT_READY' }, '*');
        }

        // Listen for messages from parent
        const handleMessage = (event: MessageEvent) => {
            const { type, data } = event.data;

            if (type === 'SEND_MESSAGE' && data?.message) {
                console.log('Message received from parent:', data.message);
                // Add code to forward this message to your ChatRevision component
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <ThemeProvider attribute="class" defaultTheme="system">
            <div className="w-full h-full">
                <ChatRevision />
            </div>
        </ThemeProvider>
    );
}