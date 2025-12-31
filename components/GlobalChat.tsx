'use client'

import { useState, useEffect, useRef } from 'react'
import { sendMessage, getMessages } from '@/app/actions/chat'
import Image from 'next/image'
import { toast } from 'sonner'

import { PremiumBadge } from './PremiumBadge'
import { ShinyText } from './ShinyText'

// Types
type Message = {
    id: string
    content: string
    createdAt: Date
    user: {
        name: string | null
        image: string | null
        rank: string
        isPremium: boolean
        profileTheme?: string
    }
}

export default function GlobalChat({ currentUser }: { currentUser: any }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Poll for messages every 2 seconds
    useEffect(() => {
        // Initial fetch
        fetchMessages();

        const interval = setInterval(() => {
            fetchMessages();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        const msgs = await getMessages();
        if (msgs) {
            setMessages(msgs as any);
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const tempContent = input;
        setInput(""); // Optimistic clear
        setLoading(true);

        const result = await sendMessage(tempContent);
        setLoading(false);

        if (result.success) {
            fetchMessages();
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            // SECURITY: Don't expose raw server errors to user. 
            // Only show known friendly messages.
            const errorMsg = result.error as string;
            const friendlyErrors = [
                "Please wait 3 seconds before sending another message.",
                "Empty message",
                "Not authenticated"
            ];

            if (friendlyErrors.includes(errorMsg)) {
                toast.error(errorMsg);
            } else {
                console.error("Chat Server Error:", errorMsg);
                toast.error("Could not send message. Please try again.");
            }
            setInput(tempContent);
        }
    }

    return (
        <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-zinc-900/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-zinc-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                    <h3 className="font-bold text-white tracking-widest uppercase">Global Chat</h3>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                    {messages.length} messages loaded
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 italic">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="shrink-0 pt-1">
                                    <a href={`/profile/${msg.user.name}`} className="block transition-transform hover:scale-110">
                                        <div className={`relative h-8 w-8 rounded-lg overflow-hidden border ${msg.user.isPremium ? 'border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'border-zinc-700'}`}>
                                            {msg.user.image ? (
                                                <Image
                                                    src={msg.user.image}
                                                    alt={msg.user.name || "User"}
                                                    width={32}
                                                    height={32}
                                                    className="object-cover w-full h-full"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm font-bold">
                                                    {msg.user.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                    </a>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold truncate flex items-center gap-1.5">
                                            {msg.user.isPremium ? (
                                                <ShinyText text={msg.user.name || 'Unknown'} theme={msg.user.profileTheme} />
                                            ) : (
                                                <span className="text-zinc-300">{msg.user.name}</span>
                                            )}
                                            {msg.user.isPremium && <PremiumBadge theme={msg.user.profileTheme} />}
                                        </span>
                                        <span className="text-[10px] text-zinc-600 font-mono">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-zinc-300 text-sm leading-relaxed break-words">
                                        {msg.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-950/80 border-t border-white/5">
                {currentUser ? (
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/20 transition-all font-medium"
                            maxLength={500}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-6 py-2 bg-brand-green text-black font-bold uppercase tracking-wide rounded-lg hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "..." : "SEND"}
                        </button>
                    </form>
                ) : (
                    <div className="text-center p-3 bg-zinc-900/50 rounded-lg border border-white/5 text-zinc-500 text-sm">
                        Please <a href="/api/auth/signin" className="text-brand-green hover:underline">login</a> to chat.
                    </div>
                )}
            </div>
        </div>
    )
}
