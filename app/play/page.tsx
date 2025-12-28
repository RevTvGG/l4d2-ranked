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
    const [isVetoing, setIsVetoing] = useState(false);

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
                const matchId = (status as any)?.matchId || (status as any)?.queueEntry?.matchId;
                if (matchId) {
                    const match = await getMatch(matchId);
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
        const currentMatchId = (queueStatus as any)?.matchId || (queueStatus as any)?.match?.id;
        if (!currentMatchId) {
            console.error('[DEBUG] No matchId found for accept');
            return;
        }
        console.log('[DEBUG] Accepting match:', currentMatchId);
        setIsAccepted(true);
        const result = await acceptMatch(currentMatchId);
        console.log('[DEBUG] Accept result:', result);
    };

    const handleVoteMap = async (map: string) => {
        if (isVetoing) return;
        setIsVetoing(true);
        console.log('[DEBUG] Voting for map:', map);
        try {
            // Need matchId here. 
            // In the failed chunk it used 'matchId' variable which might not be in scope here!
            // Let's use the safer detection:
            const currentMatchId = (queueStatus as any)?.matchId || (queueStatus as any)?.match?.id || (queueStatus as any)?.queueEntry?.matchId;

            if (!currentMatchId) {
                console.error("No match ID for voting");
                return;
            }

            const result = await voteMap(currentMatchId, map);
            console.log('[DEBUG] Vote result:', result);

            if (result.error) {
                setErrorMsg(result.error);
            }
            // Refresh match data immediately is handled by polling but we can double tap
            const match = await getMatch(currentMatchId);
            setMatchData(match);

        } catch (e) {
            setErrorMsg('Failed to vote');
            console.error(e);
        } finally {
            setIsVetoing(false);
        }
    };

    const handleTestMode = async () => {
        try {
            setErrorMsg('Activating Test Mode...');
            const response = await fetch('/api/test/auto-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success) {
                console.log('[TEST MODE] Activated:', data);
                setErrorMsg(null);
            } else {
                setErrorMsg('Test Failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('[TEST MODE] Error:', error);
            setErrorMsg('Test Mode Error: ' + String(error));
        }
    };

    const handleResetServer = async () => {
        if (!confirm('Are you sure you want to reset all servers and matches?')) return;
        try {
            setErrorMsg('Resetting system...');
            await fetch('/api/test/reset-server', { method: 'POST' });
            setErrorMsg('System Reset! Try again.');
            setQueueStatus(null);
        } catch (e) {
            setErrorMsg('Reset failed');
        }
    }

    if (status === 'loading') return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-brand-green">Loading...</div>;
    // Check if user is in queue
    const inQueue = (queueStatus as any)?.status === 'WAITING' || (queueStatus as any)?.status === 'MATCHED';

    console.log('[DEBUG] Queue Status:', queueStatus);
    console.log('[DEBUG] In Queue:', inQueue);
    console.log('[DEBUG] Queue Status Status:', (queueStatus as any)?.status);
    console.log('[DEBUG] Match Data:', matchData);

    // Better matchId detection - check multiple sources
    const matchId = (queueStatus as any)?.matchId || (queueStatus as any)?.match?.id;
    const isReadyCheck = matchId && matchData?.status === 'READY_CHECK';
    const isMatchReady = matchId && matchData?.status === 'READY';
    const isVeto = matchData?.status === 'VETO';
    const isLive = matchData?.status === 'IN_PROGRESS' || matchData?.status === 'WAITING_FOR_PLAYERS';

    console.log('[DEBUG] Match ID:', matchId);
    console.log('[DEBUG] Is Ready Check:', isReadyCheck);
    console.log('[DEBUG] Match Status:', matchData?.status);

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

                                    {/* NEXT PLAYERS IN QUEUE */}
                                    {queueStatus?.nextPlayers && queueStatus.nextPlayers.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Next Match ({queueStatus.nextPlayers.length}/8)</h4>
                                            <div className="grid grid-cols-4 gap-3">
                                                {queueStatus.nextPlayers.map((entry: any) => (
                                                    <div key={entry.id} className="flex flex-col items-center gap-1.5">
                                                        <div className="relative group">
                                                            {entry.user.image ? (
                                                                <img
                                                                    src={entry.user.image}
                                                                    alt={entry.user.name || 'Player'}
                                                                    className="w-14 h-14 rounded-full border-2 border-zinc-700 group-hover:border-brand-green transition-colors object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        const fallback = target.nextElementSibling as HTMLElement;
                                                                        if (fallback) fallback.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className="w-14 h-14 rounded-full border-2 border-zinc-700 group-hover:border-brand-green transition-colors bg-zinc-800 flex items-center justify-center"
                                                                style={{ display: entry.user.image ? 'none' : 'flex' }}
                                                            >
                                                                <span className="text-zinc-500 text-lg font-bold">
                                                                    {(entry.user.name || 'P')[0].toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className="absolute -bottom-0.5 -right-0.5 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[9px] font-bold text-brand-green shadow-lg">
                                                                {entry.user.rating}
                                                            </div>
                                                        </div>
                                                        <span
                                                            className="text-[9px] text-zinc-400 text-center w-full block overflow-hidden text-ellipsis whitespace-nowrap px-0.5"
                                                            title={entry.user.name || 'Unknown'}
                                                            style={{ maxWidth: '60px' }}
                                                        >
                                                            {entry.user.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                ))}
                                                {/* Empty slots */}
                                                {Array.from({ length: 8 - (queueStatus.nextPlayers?.length || 0) }).map((_, i) => (
                                                    <div key={`empty-${i}`} className="flex flex-col items-center gap-1.5">
                                                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                                                            <span className="text-zinc-700 text-xl">?</span>
                                                        </div>
                                                        <span className="text-[9px] text-zinc-700">Waiting...</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/10"></div>

                                    {/* QUEUE ACTION BUTTON */}
                                    {errorMsg && (
                                        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center border border-red-500/30 mb-2">
                                            {errorMsg}
                                        </div>
                                    )}
                                    {!(queueStatus as any)?.matchId && (
                                        <>
                                            <button
                                                onClick={inQueue ? handleLeaveQueue : handleJoinQueue}
                                                className={`w-full py-4 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg transform hover:-translate-y-1 ${inQueue
                                                    ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                                                    : 'bg-brand-green hover:bg-lime-400 text-black shadow-brand-green/20'
                                                    }`}
                                            >
                                                {inQueue ? 'Leave Queue' : 'Buscar Partida'}
                                            </button>

                                            {!inQueue && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleTestMode}
                                                        className="flex-1 py-3 font-bold uppercase tracking-wide rounded-xl transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transform hover:-translate-y-1 text-xs"
                                                    >
                                                        🧪 Test (1 Player + 7 Bots)
                                                    </button>
                                                    <button
                                                        onClick={handleResetServer}
                                                        className="px-4 py-3 font-bold uppercase rounded-xl transition-all bg-zinc-800 hover:bg-red-600 text-white shadow-lg transform hover:-translate-y-1 text-xs"
                                                        title="Reset Servers & Queue"
                                                    >
                                                        🗑️ Reset
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* ALWAYS VISIBLE RESET BUTTON (Panic Button) */}
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-2">
                                        {matchId && (
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Force Start Match?')) return;
                                                    await fetch('/api/test/force-start', {
                                                        method: 'POST',
                                                        body: JSON.stringify({ matchId }),
                                                        headers: { 'Content-Type': 'application/json' }
                                                    });
                                                    // Also call server action directly if possible, but route is easier for client comp
                                                    // We'll implemented a quick route or just use the action if we import it.
                                                    // Since we can't easily import server actions in client components in this setup without passing it down, 
                                                    // let's use the route approach or assume we can call the action.
                                                    // Wait, we can import server actions!
                                                }}
                                                className="px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-500/30 flex items-center gap-2"
                                                title="Force Start Match (Bypass Ready Check)"
                                            >
                                                <span>⚡</span> Force Start
                                            </button>
                                        )}
                                        <button
                                            onClick={handleResetServer}
                                            className="px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all bg-zinc-800/50 hover:bg-red-900/50 text-zinc-500 hover:text-red-200 border border-white/5 hover:border-red-500/30 flex items-center gap-2"
                                            title="Force Reset System (Use if stuck)"
                                        >
                                            <span>🗑️</span> Force Reset System
                                        </button>
                                    </div>

                                    {/* MATCH FOUND / ACCEPT - Shows during READY_CHECK phase */}
                                    {(isReadyCheck || (matchId && matchData?.status === 'READY_CHECK')) && !isVeto && !isLive && (
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
                                                        disabled={isVetoing}
                                                        className={`p-2 text-xs border rounded transition-colors ${isVetoing
                                                            ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-wait'
                                                            : 'bg-zinc-800 hover:bg-blue-500/20 border-white/5 hover:border-blue-500/50 text-white'
                                                            }`}
                                                    >
                                                        {isVetoing ? 'Voting...' : map}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="text-xs text-center text-zinc-400">
                                                Votes: {matchData?.mapVotes?.length || 0}/8
                                            </div>
                                            {/* Force Win Button (Debug) */}
                                            <div className="pt-2 border-t border-blue-500/20 flex justify-center">
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Force Map Win (Dark Carnival)?')) return;
                                                        await fetch('/api/test/force-map', {
                                                            method: 'POST',
                                                            body: JSON.stringify({ matchId }),
                                                            headers: { 'Content-Type': 'application/json' }
                                                        });
                                                    }}
                                                    className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-blue-900/40 hover:bg-blue-800 text-blue-300 border border-blue-500/30"
                                                >
                                                    ⚡ Force Map Win
                                                </button>
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
                                                    <span className="font-bold select-all">{matchData?.serverPassword || 'Loading...'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-60">Map:</span>
                                                    <span className="font-bold">{matchData?.mapName || 'Unknown Map'}</span>
                                                </div>
                                            </div>
                                            <div className="text-center text-xs font-bold opacity-75">
                                                Connect via console: connect 50.20.249.93:27015; password {matchData?.serverPassword || '...'}
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
