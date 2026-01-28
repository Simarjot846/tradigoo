
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        // Gemini requires history to start with a 'user' role.
        // We remove the initial 'model' welcome message if present.
        let validHistory = history || [];
        if (validHistory.length > 0 && (validHistory[0].role === 'model' || validHistory[0].role === 'assistant')) {
            validHistory = validHistory.slice(1);
        }

        // Check for API key dynamically on every request
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.log("Chatbot: Missing GEMINI_API_KEY");
            return NextResponse.json({
                reply: "I am currently running in demo mode because my AI Brain (GEMINI_API_KEY) is missing. Please add the API key to your .env.local file to unlock my full potential! 🧠✨"
            });
        }

        // Initialize Gemini with the current key
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using 'gemini-2.5-flash' as the latest stable model available for this key
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const systemPrompt = `
You are Tradigoo Assistant, a bilingual AI helper for a B2B agricultural marketplace(connecting farmers / wholesalers to retailers).
Your goal is to help users with:
1. Understanding market trends(prices of grains, pulses, etc.).
2. Navigating the platform(how to list products, how to use the app).
3. Resolving disputes or explaining policies.

    Guidelines:
- If the user writes in Hindi, reply in Hindi.
- If the user writes in English, reply in English.
- Be professional, trustworthy, and concise.
- Do not make up fake real - time prices.If asked, say "Please check the Dashboard for the latest AI-driven market rates."
    - If asked about "Tradigoo", describe it as a secure, transparent platform for bulk agricultural trade.

Current Context:
User is asking for help.
`;

        const chat = model.startChat({
            history: validHistory,
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        // Simple approach: combine system prompt + message
        const fullMessage = `${systemPrompt}\n\nUser Message: ${message} `;

        const result = await chat.sendMessage(fullMessage);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });
    } catch (error: any) {
        console.error('Gemini API Error details:', error.message || error);

        return NextResponse.json({
            reply: `System Error: ${error.message || 'Unknown error'}`
        });
    }
}
