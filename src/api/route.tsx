// app/api/chat/message/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Update this constant with your actual backend URL
const BACKEND_URL = 'http://localhost:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward the request to your backend server
        const response = await fetch(`${BACKEND_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in chat message API route:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                answer: "Sorry, I encountered an error processing your request."
            },
            { status: 500 }
        );
    }
}

// app/api/chat/history/[thread_id]/route.ts
export async function GET(
    request: NextRequest,
    { params }: { params: { thread_id: string } }
) {
    try {
        const threadId = params.thread_id;

        // Forward the request to your backend server
        const response = await fetch(`${BACKEND_URL}/chat/history/${threadId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in chat history API route:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                messages: []
            },
            { status: 500 }
        );
    }
}