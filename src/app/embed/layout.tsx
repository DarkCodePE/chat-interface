// src/app/embed/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Chat de Revisión Técnica",
    description: "Asistente virtual para revisiones técnicas",
};

export default function EmbedLayout({
                                        children,
                                    }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
        <body className={`${inter.className} bg-transparent overflow-hidden`}>
        {children}
        </body>
        </html>
    );
}