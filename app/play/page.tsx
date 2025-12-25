'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { joinQueue, leaveQueue, getQueueStatus } from '@/app/actions/queue';
import { acceptMatch, voteMap, getMatch } from '@/app/actions/match';
import { getOnlineUsers } from '@/app/actions/chat';
import { redirect } from 'next/navigation';
import GlobalChat from '@/components/GlobalChat';
import Link from 'next/link';
import { Navbar } from "@/components/Navbar";
import OnlineUsersList from "@/components/OnlineUsersList";

export default function PlayPage() {
    const { data: session, status } = useSession();
    const [queueStatus, setQueueStatus] = useState<any>(null);
    const [matchData, setMatchData] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isAccepted, setIsAccepted] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Redirect if not authenticated (client-side check)
    useEffect(() => {
        if (status === 'unauthenticated') {
            window.location.href = '/';
        }
    }, [status]);

    // Poll for queue status and online users
    useEffect(() => {
        if (status !== 'authenticated') return;

        const pollInterval = setInterval(async () => {
            try {
                // Get Queue Status
                const status = await getQueueStatus();
                setQueueStatus(status);

                // If match is ready or in progress, get match details
                if (status?.queueEntry?.matchId) {
                    const match = await getMatch(status.queueEntry.matchId);
                    setMatchData(match);
                } else {
                    setMatchData(null);
                    setIsAccepted(false);
                }

                // Get Online Users
                const users = await getOnlineUsers();
                setOnlineCount(users.length);

            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [status, session?.user?.id]);

    const handleJoinQueue = async () => {
        console.log('[DEBUG] Join Queue clicked');
        console.log('[DEBUG] Session:', session);
        console.log('[DEBUG] User:', session?.user);

        if (!session?.user) {
            console.error('[DEBUG] No session or user');
            setErrorMsg('Please login first');
            return;
        }

        setErrorMsg(null);
        console.log('[DEBUG] Calling joinQueue...');

        try {
            const result = await joinQueue();
            console.log('[DEBUG] Join queue result:', result);

            if (result?.error) {
                console.error('[DEBUG] Error from joinQueue:', result.error);
                setErrorMsg(result.error);
                return;
            }

            // Refresh status
            const status = await getQueueStatus();
            console.log('[DEBUG] Queue status after join:', status);
            setQueueStatus(status);
        } catch (e) {
            console.error('[DEBUG] Exception in handleJoinQueue:', e);
            setErrorMsg('Error joining queue');
        }
    };

    const handleLeaveQueue = async () => {
        if (!session?.user) return;
        await leaveQueue();
        setQueueStatus(null);
        setErrorMsg(null);
    };

    const handleAcceptMatch = async () => {
        if (!queueStatus?.queueEntry?.matchId) return;
        setIsAccepted(true);
        await acceptMatch(queueStatus.queueEntry.matchId);
    };

    const handleVoteMap = async (mapName: string) => {
        if (!queueStatus?.queueEntry?.matchId) return;
        await voteMap(queueStatus.queueEntry.matchId, mapName);
        // Refresh match data immediately
        const match = await getMatch(queueStatus.queueEntry.matchId);
        setMatchData(match);
    };

    if (status === 'loading') return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-brand-green">Loading...</div>;

    const isQueued = queueStatus?.queueEntry?.status === 'WAITING' || queueStatus?.queueEntry?.status === 'MATCHED';
    const isMatchReady = queueStatus?.queueEntry?.matchId && matchData?.status === 'READY';
    const isVeto = matchData?.status === 'VETO';
    const isLive = matchData?.status === 'IN_PROGRESS';

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-brand-green selection:text-black pb-24 flex flex-col">
            <Navbar />

            <div className="relative pt-32 pb-12 flex-1 flex flex-col items-center px-6">
                {/* Background */}
                <div className="absolute inset-0 bg-[url('/l4d2_bg.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay fixed"></div>

                <div className="relative z-10 w-full max-w-6xl space-y-8">
                    <div className="text-center space-y-4 mb-12">
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-white">
                            Matchmaking <span className="text-brand-green">Lobby</span>
                        </h1>
                        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                            Chat with other players, look for a team, or wait for the next queue pop.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Chat */}
                        <div className="lg:col-span-2">
                            <GlobalChat currentUser={session?.user} />
                        </div>

                        {/* RIGHT COLUMN: Queue/Status */}
                        <div className="space-y-6">
                            {/* ONLINE USERS LIST */}
                            <OnlineUsersList />

                            {/* QUEUE STATUS CARD */}
                            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="text-2xl">🔥</span> Queue Status
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Players Online</span>
                                        <span className="text-brand-green font-mono font-bold">{onlineCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Players in Queue</span>
                                        <span className="text-brand-green font-mono font-bold">
                                            {queueStatus?.totalInQueue || 0}/8
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Active Matches</span>
                                        <span className="text-brand-green font-mono font-bold">
                                            {queueStatus?.activeMatches || 0}
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/10"></div>

                                    {/* QUEUE ACTION BUTTON */}
                                    {errorMsg && (
                                        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center border border-red-500/30 mb-2">
                                            {errorMsg}
                                        </div>
                                    )}
                                    {!queueStatus?.queueEntry?.matchId && (
                                        <button
                                            onClick={isQueued ? handleLeaveQueue : handleJoinQueue}
                                            className={`w-full py-4 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg transform hover:-translate-y-1 ${isQueued
                                                ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                                                : 'bg-brand-green hover:bg-lime-400 text-black shadow-brand-green/20'
                                                }`}
                                        >
                                            {isQueued ? 'Leave Queue' : 'Buscar Partida'}
                                        </button>
                                    )}

                                    {/* MATCH FOUND / ACCEPT */}
                                    {queueStatus?.queueEntry?.matchId && !isVeto && !isLive && !isMatchReady && (
                                        <div className="animate-pulse bg-brand-green/20 border border-brand-green/50 p-4 rounded-xl text-center space-y-3">
                                            <div className="text-brand-green font-bold text-xl">MATCH FOUND!</div>
                                            <div className="text-sm text-zinc-300">Accept to join the lobby</div>
                                            <button
                                                onClick={handleAcceptMatch}
                                                disabled={isAccepted}
                                                className={`w-full py-3 font-bold rounded-lg uppercase ${isAccepted
                                                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                                                    : 'bg-brand-green text-black hover:scale-105 transition-transform'
                                                    }`}
                                            >
                                                {isAccepted ? 'Waiting for others...' : 'ACCEPT MATCH'}
                                            </button>
                                            <div className="flex justify-center gap-1 mt-2">
                                                {matchData?.players?.map((p: any) => (
                                                    <div
                                                        key={p.userId}
                                                        className={`w-3 h-3 rounded-full transition-colors ${p.accepted ? 'bg-brand-green' : 'bg-zinc-700'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* VETO PHASE */}
                                    {isVeto && (
                                        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl space-y-3">
                                            <div className="text-blue-400 font-bold text-center">MAP VETO</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Dark Carnival', 'Dead Center', 'No Mercy', 'The Parish'].map(map => (
                                                    <button
                                                        key={map}
                                                        onClick={() => handleVoteMap(map)}
                                                        className="p-2 text-xs bg-zinc-800 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/50 rounded transition-colors"
                                                    >
                                                        {map}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="text-xs text-center text-zinc-400">
                                                Votes: {matchData?.mapVotes?.length || 0}/8
                                            </div>
                                        </div>
                                    )}

                                    {/* READY TO CONNECT */}
                                    {isMatchReady && (
                                        <div className="bg-brand-green text-black p-6 rounded-xl space-y-4 shadow-xl shadow-brand-green/20 animate-bounce-subtle">
                                            <div className="text-center font-black text-2xl tracking-tighter">MATCH READY</div>
                                            <div className="bg-black/20 p-4 rounded-lg space-y-2 font-mono text-sm">
                                                <div className="flex justify-between">
                                                    <span className="opacity-60">Server IP:</span>
                                                    <span className="font-bold select-all">50.20.249.93:27015</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-60">Password:</span>
                                                    <span className="font-bold select-all">{matchData?.serverPassword}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-60">Map:</span>
                                                    <span className="font-bold">{matchData?.mapName}</span>
                                                </div>
                                            </div>
                                            <div className="text-center text-xs font-bold opacity-75">
                                                Connect via console: connect 50.20.249.93:27015; password {matchData?.serverPassword}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                                <h3 className="font-bold text-white mb-2">📢 Server News</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">
                                    Don&apos;t forget to join our Discord for tournament announcements. Season 1 ends in 2 weeks!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
