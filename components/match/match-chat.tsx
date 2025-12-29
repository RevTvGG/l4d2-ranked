'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface ChatMessage {
    id: string;
    content: string;
    createdAt: string;
    user: {
        name: string | null;
        image: string | null;
        isPremium: boolean;
    };
}

interface MatchChatProps {
    matchId: string;
}

export default function MatchChat({ matchId }: MatchChatProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [matchId]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/match/${matchId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/match/${matchId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: input.trim() })
            });

            if (res.ok) {
                setInput('');
                fetchMessages();
                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                const data = await res.json();
                console.error('Failed to send:', data.error);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-gray-900/50 border border-white/10 rounded-lg flex flex-col h-[400px]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <h3 className="font-semibold text-white">Match Chat</h3>
                <span className="text-xs text-gray-500 ml-auto">{messages.length} messages</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <p className="text-gray-600 text-sm text-center italic">No messages yet. Say hi to your teammates!</p>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                {msg.user.image ? (
                                    <Image
                                        src={msg.user.image}
                                        alt=""
                                        width={24}
                                        height={24}
                                        className="object-cover w-full h-full"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                        {msg.user.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-xs font-bold ${msg.user.isPremium ? 'text-amber-400' : 'text-gray-400'}`}>
                                        {msg.user.name}
                                    </span>
                                    <span className="text-[10px] text-gray-600">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 break-words">{msg.content}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
                {session ? (
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-800 border border-white/10 rounded-md px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50"
                            maxLength={300}
                        />
                        <button
                            type="submit"
                            disabled={sending || !input.trim()}
                            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            Send
                        </button>
                    </form>
                ) : (
                    <p className="text-center text-gray-500 text-sm">Login to chat</p>
                )}
            </div>
        </div>
    );
}
