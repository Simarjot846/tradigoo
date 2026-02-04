'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Mic, Sparkles } from 'lucide-react';


type Message = {
    role: 'user' | 'model';
    text: string;
};

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Namaste! I am Tradigoo Assistant. How can I help you today? (Ask me about prices, orders, or how to use the app)' }
    ]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Prepare history for API
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history })
            });

            const data = await res.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const startListening = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } else {
            alert('Voice input is not supported in this browser.');
        }
    };

    return (
        <>
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
                    {/* Text Bubble */}
                    <div className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hidden md:block">
                        Need help? 🤖
                    </div>

                    <Button
                        onClick={() => setIsOpen(true)}
                        className="h-16 w-16 rounded-full bg-blue-600 shadow-xl hover:shadow-2xl hover:scale-105 transition-all relative overflow-visible group"
                    >
                        {/* Icon */}
                        <div className="relative flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                    </Button>
                </div>
            )}

            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden"
                    style={{ height: isMinimized ? 'auto' : '500px' }}>
                    {/* Header */}
                    <div className="p-4 bg-zinc-800 flex items-center justify-between border-b border-zinc-700 cursor-pointer" onClick={() => !isMinimized && setIsMinimized(!isMinimized)}>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Tradigoo Assistant</h3>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-green-500" /> Online
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="h-8 w-8 text-zinc-400 hover:text-white">
                                <Minimize2 size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-zinc-400 hover:text-white">
                                <X size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    {!isMinimized && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50" ref={scrollRef}>
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700'
                                            }`}>
                                            {m.text}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-sm border border-zinc-700 flex items-center gap-2 text-zinc-400 text-xs">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-3 bg-zinc-800/50 border-t border-zinc-700">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex gap-2"
                                >
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={startListening}
                                        className={`transition-colors ${isListening ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                        <Mic size={20} />
                                    </Button>
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="bg-zinc-900 border-zinc-700 text-white focus:ring-blue-500/50"
                                    />
                                    <Button type="submit" size="icon" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-500">
                                        <Send size={16} />
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
