// src/app/embed/page.tsx
"use client";

import React from 'react';
import ChatRevision from '@/components/chat-revision';
import { ThemeProvider } from "@/components/theme-provider";

export default function EmbedPage() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system">
            <div className="w-full h-full">
                <ChatRevision />
            </div>
        </ThemeProvider>
    );
}