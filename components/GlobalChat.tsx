'use client'

import { useState, useEffect, useRef } from 'react'
import { sendMessage, getMessages } from '@/app/actions/chat'
import Image from 'next/image'
import { toast } from 'sonner'

import { PremiumBadge } from './PremiumBadge'
import { ShinyText } from './ShinyText'
import PremiumUsername from './PremiumUsername'

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
        nameGradient?: string | null
        customFont?: string | null
        profileGlow?: boolean
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
            // Removed auto-scroll - let user scroll manually
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
        <div className="relative flex flex-col h-[600px] w-full bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-2 border-brand-green/40 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(74,222,128,0.5),0_0_40px_-10px_rgba(74,222,128,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] group hover:border-brand-green/80 hover:shadow-[0_30px_100px_-20px_rgba(74,222,128,0.7),0_0_60px_-10px_rgba(74,222,128,0.5)] transition-all duration-700">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {/* Multiple animated scan lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-brand-green/60 to-transparent animate-scan-line shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent animate-scan-line" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Premium corner frame */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-green/60 rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-green/60 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-green/60 rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-green/60 rounded-br-2xl"></div>

            {/* Inner glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-brand-green/20 to-transparent blur-3xl"></div>

            {/* Header */}
            <div className="p-6 border-b border-brand-green/20 bg-black/30 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
                    </span>
                    <h3 className="font-black text-white tracking-wider uppercase text-base bg-gradient-to-r from-white via-brand-green to-white bg-clip-text text-transparent animate-text-shimmer drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                        GLOBAL CHAT
                    </h3>
                </div>
                <div className="text-xs text-zinc-500 font-mono bg-zinc-950/50 px-3 py-1 rounded-full border border-white/10">
                    {messages.length} msgs
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-brand-green/30 scrollbar-track-transparent relative z-10">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 italic">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="group/msg animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/40 hover:bg-zinc-900/60 border border-white/5 hover:border-brand-green/20 transition-all">
                                {/* Avatar */}
                                <div className="shrink-0 pt-1">
                                    <a href={`/profile/${msg.user.name}`} className="block transition-transform hover:scale-110">
                                        <div className={`relative h-10 w-10 rounded-xl overflow-hidden border-2 ${msg.user.isPremium ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-brand-green/50'} hover:border-brand-green`}>
                                            {msg.user.image ? (
                                                <Image
                                                    src={msg.user.image}
                                                    alt={msg.user.name || "User"}
                                                    width={40}
                                                    height={40}
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
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-sm font-bold truncate flex items-center gap-1.5">
                                            {msg.user.isPremium ? (
                                                <PremiumUsername
                                                    username={msg.user.name || 'Unknown'}
                                                    isPremium={true}
                                                    profileTheme={msg.user.profileTheme}
                                                    nameGradient={msg.user.nameGradient}
                                                    customFont={msg.user.customFont}
                                                    size="sm"
                                                    showBadge={false}
                                                    showGlow={msg.user.profileGlow}
                                                />
                                            ) : (
                                                <span className="text-white">{msg.user.name}</span>
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
            <div className="p-6 bg-black/50 border-t border-brand-green/20 relative z-10">
                {currentUser ? (
                    <form onSubmit={handleSend} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-zinc-950/80 border-2 border-white/10 rounded-xl px-5 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-green/60 focus:ring-2 focus:ring-brand-green/20 transition-all font-medium"
                            maxLength={500}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-8 py-3 bg-gradient-to-r from-brand-green to-emerald-500 text-black font-black uppercase tracking-wide rounded-xl hover:from-lime-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.6)] transform hover:-translate-y-0.5"
                        >
                            {loading ? "..." : "SEND"}
                        </button>
                    </form>
                ) : (
                    <div className="text-center p-4 bg-zinc-950/50 rounded-xl border border-white/10 text-zinc-500 text-sm">
                        Please <a href="/api/auth/signin" className="text-brand-green hover:underline font-bold">login</a> to chat.
                    </div>
                )}
            </div>
        </div>
    )
}
