'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { joinQueue, leaveQueue, getQueueStatus, resetQueueState } from '@/app/actions/queue';
import { acceptMatch, voteMap, getMatch, leaveMatch } from '@/app/actions/match';
import { getOnlineUsers } from '@/app/actions/chat';
import { redirect } from 'next/navigation';
import GlobalChat from '@/components/GlobalChat';
import Link from 'next/link';
import OnlineUsersList from "@/components/OnlineUsersList";
import ParticleBackground from "@/components/ParticleBackground";

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
    // Poll for queue status and online users
    useEffect(() => {
        if (status !== 'authenticated') return;

        const poll = async () => {
            // Optimization: Don't poll if tab is in background
            if (document.hidden) return;

            try {
                // Send heartbeat to update user's online status
                fetch('/api/heartbeat', { method: 'POST' }).catch(() => { });

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
        };

        // Initial call
        poll();

        const pollInterval = setInterval(poll, 3000);

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

            if (!result.success) {
                console.error('[DEBUG] Error from joinQueue:', result.message);
                setErrorMsg(result.message);
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
        setMatchData(null);
        setIsAccepted(false);
        setErrorMsg(null);
    };

    const handleDeclineMatch = async () => {
        if (!session?.user) return;
        const currentMatchId = (queueStatus as any)?.matchId || (queueStatus as any)?.match?.id;

        // Leave match first (removes from MatchPlayer)
        if (currentMatchId) {
            await leaveMatch(currentMatchId);
        }

        // Then leave queue
        await leaveQueue();

        // Reset local state
        setQueueStatus(null);
        setMatchData(null);
        setIsAccepted(false);
        setErrorMsg(null);
    };

    const handleReset = async () => {
        if (!session?.user) return;
        await resetQueueState();
        setQueueStatus(null);
        setMatchData(null);
        setIsAccepted(false);
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
        <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-green selection:text-black flex flex-col">

            {/* Hero Background Section */}
            <div className="relative min-h-screen flex flex-col">
                {/* Background with Overlay - NO IMAGE */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
                    {/* Animated gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/5 via-transparent to-emerald-500/5 animate-gradient-shift" />
                    <ParticleBackground />
                </div>

                {/* Content */}
                <div className="relative z-10 pt-32 pb-12 flex-1 flex flex-col items-center px-6">
                    <div className="w-full max-w-6xl space-y-8">
                        {/* Title Section */}
                        <div className="text-center space-y-6 mb-12 animate-fade-in-up">
                            {/* Animated Gamer Title */}
                            <div className="relative inline-block">
                                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase">
                                    <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">MATCH</span>
                                    <span className="animate-text-shimmer">MAKING</span>
                                </h1>
                                <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-brand-green/10 to-transparent blur-xl -z-10 animate-pulse"></div>
                            </div>

                            {/* Subtitle with animated underline */}
                            <div className="relative">
                                <p className="text-xl md:text-2xl text-zinc-300 font-medium tracking-wide">
                                    Enter the <span className="text-brand-green font-bold">Arena</span>. Prove your <span className="text-brand-green font-bold">Worth</span>.
                                </p>
                                <div className="mt-2 h-0.5 w-32 mx-auto bg-gradient-to-r from-transparent via-brand-green to-transparent"></div>
                            </div>

                            {/* Live Status Badges */}
                            <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                                <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm px-5 py-2.5 rounded-full border border-brand-green/30 animate-border-glow">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
                                    </span>
                                    <span className="text-zinc-400">LIVE</span>
                                    <span className="text-brand-green font-bold font-mono text-lg">{onlineCount}</span>
                                    <span className="text-zinc-500">players</span>
                                </div>
                                <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10">
                                    <span className="text-2xl">⚔️</span>
                                    <span className="text-zinc-400">Active:</span>
                                    <span className="text-amber-400 font-bold font-mono">{queueStatus?.activeMatches || 0}</span>
                                    <span className="text-zinc-500">matches</span>
                                </div>
                            </div>
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

                                {/* QUEUE STATUS CARD - PREMIUM 3D DESIGN */}
                                <div className="relative bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-black/95 border-2 border-brand-green/40 p-8 rounded-3xl backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(74,222,128,0.5),0_0_40px_-10px_rgba(74,222,128,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-brand-green/80 hover:shadow-[0_30px_100px_-20px_rgba(74,222,128,0.7),0_0_60px_-10px_rgba(74,222,128,0.5)] transition-all duration-700 overflow-hidden group transform hover:-translate-y-2 hover:scale-[1.02]">
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

                                    <h3 className="font-black text-white mb-6 flex items-center gap-3 uppercase tracking-wider text-base relative z-10 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                                        <span className="text-3xl animate-float drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">⚔️</span>
                                        <span className="bg-gradient-to-r from-white via-brand-green to-white bg-clip-text text-transparent animate-text-shimmer">BATTLE QUEUE</span>
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
                                                            <Link href={`/profile/${entry.user.steamId || entry.user.name}`} className="group flex flex-col items-center gap-1.5 w-full">
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
                                                                    className="text-[9px] text-zinc-400 group-hover:text-brand-green transition-colors text-center w-full block overflow-hidden text-ellipsis whitespace-nowrap px-0.5"
                                                                    title={entry.user.name || 'Unknown'}
                                                                    style={{ maxWidth: '60px' }}
                                                                >
                                                                    {entry.user.name || 'Unknown'}
                                                                </span>
                                                            </Link>
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
                                                    className={`relative w-full py-5 font-black uppercase tracking-widest rounded-xl transition-all transform hover:-translate-y-2 hover:scale-[1.03] active:scale-[0.98] overflow-hidden group ${inQueue
                                                        ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_50px_-10px_rgba(239,68,68,0.7)] border-2 border-red-400/50'
                                                        : 'relative bg-gradient-to-br from-brand-green to-emerald-500 text-black shadow-[0_0_60px_-10px_rgba(74,222,128,0.8),inset_0_0_20px_rgba(255,255,255,0.3)] border-2 border-lime-300/50 animate-glow-pulse hover:from-lime-400 hover:to-emerald-400 hover:shadow-[0_0_80px_-10px_rgba(74,222,128,1),inset_0_0_30px_rgba(255,255,255,0.5)]'
                                                        }`}
                                                >
                                                    {/* Button shine effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                                                    <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                                                        {inQueue ? (
                                                            <>
                                                                <span className="text-2xl">❌</span>
                                                                Leave Queue
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-2xl animate-bounce">🎮</span>
                                                                FIND MATCH
                                                            </>
                                                        )}
                                                    </span>
                                                </button>


                                            </>
                                        )}

                                        {/* Reset link for stuck players */}
                                        <button
                                            onClick={handleReset}
                                            className="text-xs text-zinc-600 hover:text-red-400 transition-colors underline"
                                        >
                                            🔄 Stuck? Reset Queue State
                                        </button>



                                        {/* MATCH FOUND / ACCEPT - Shows during READY_CHECK phase */}
                                        {(isReadyCheck || (matchId && matchData?.status === 'READY_CHECK')) && !isVeto && !isLive && (
                                            <div className="bg-gradient-to-br from-brand-green/30 to-emerald-900/20 border-2 border-brand-green/60 p-6 rounded-2xl text-center space-y-4 shadow-[0_0_50px_-10px_rgba(74,222,128,0.5)] animate-pulse">
                                                <div className="text-brand-green font-black text-2xl uppercase tracking-wider drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
                                                    🎮 MATCH FOUND!
                                                </div>
                                                <div className="text-sm text-zinc-300">Accept to join the lobby</div>
                                                <button
                                                    onClick={handleAcceptMatch}
                                                    disabled={isAccepted}
                                                    className={`w-full py-4 font-black rounded-xl uppercase text-lg transition-all ${isAccepted
                                                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed border border-zinc-600'
                                                        : 'bg-brand-green text-black hover:scale-105 shadow-[0_0_30px_rgba(74,222,128,0.4)] border border-lime-300/50'
                                                        }`}
                                                >
                                                    {isAccepted ? '⏳ Waiting for others...' : '✅ ACCEPT MATCH'}
                                                </button>
                                                {/* DECLINE BUTTON - Leave queue during ready check */}
                                                <button
                                                    onClick={handleDeclineMatch}
                                                    className="w-full py-3 font-bold rounded-xl uppercase text-sm transition-all bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 hover:scale-[1.02]"
                                                >
                                                    ❌ DECLINE MATCH
                                                </button>
                                                <div className="flex justify-center gap-2 mt-3">
                                                    {matchData?.players?.map((p: any) => (
                                                        <div
                                                            key={p.userId}
                                                            className={`w-4 h-4 rounded-full transition-all duration-300 ${p.accepted
                                                                ? 'bg-brand-green shadow-[0_0_10px_rgba(74,222,128,0.8)]'
                                                                : 'bg-zinc-700 border border-zinc-600'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="text-xs text-zinc-500">
                                                    {matchData?.players?.filter((p: any) => p.accepted).length || 0}/8 players ready
                                                </div>
                                            </div>
                                        )}

                                        {/* VETO PHASE */}
                                        {isVeto && (
                                            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-900/20 border-2 border-blue-500/40 p-6 rounded-2xl space-y-4 shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]">
                                                <div className="text-blue-400 font-black text-xl text-center uppercase tracking-wider">
                                                    🗺️ MAP SELECTION
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Dark Carnival', 'Dead Center', 'No Mercy', 'The Parish'].map(map => (
                                                        <button
                                                            key={map}
                                                            onClick={() => handleVoteMap(map)}
                                                            disabled={isVetoing}
                                                            className={`p-3 text-sm font-bold border-2 rounded-xl transition-all ${isVetoing
                                                                ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-wait'
                                                                : 'bg-zinc-800/80 hover:bg-blue-500/30 border-zinc-700 hover:border-blue-500/60 text-white hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'
                                                                }`}
                                                        >
                                                            {isVetoing ? '⏳ Voting...' : map}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="text-sm text-center text-zinc-400 bg-zinc-900/50 py-2 rounded-lg">
                                                    Votes: <span className="text-blue-400 font-bold">{matchData?.mapVotes?.length || 0}</span>/8
                                                </div>
                                            </div>
                                        )}

                                        {/* READY TO CONNECT / WAITING FOR PLAYERS / IN PROGRESS */}
                                        {(isMatchReady || isLive) && (
                                            <div className={`p-6 rounded-2xl space-y-4 border-2 ${matchData?.status === 'IN_PROGRESS'
                                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-black shadow-[0_0_50px_-10px_rgba(245,158,11,0.6)] border-amber-400/50'
                                                : 'bg-gradient-to-br from-brand-green to-emerald-600 text-black shadow-[0_0_50px_-10px_rgba(74,222,128,0.6)] border-lime-400/50'
                                                }`}>
                                                <div className="text-center font-black text-2xl tracking-tighter uppercase">
                                                    {matchData?.status === 'IN_PROGRESS' ? '⚔️ MATCH IN PROGRESS' :
                                                        matchData?.status === 'WAITING_FOR_PLAYERS' ? '⏳ WAITING FOR PLAYERS' :
                                                            '🎮 MATCH READY'}
                                                </div>

                                                {/* Server Info */}
                                                <div className="bg-black/20 p-4 rounded-lg space-y-2 font-mono text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="opacity-60">Server IP:</span>
                                                        <span className="font-bold select-all">
                                                            {matchData?.serverIp || matchData?.server?.ipAddress || 'Loading...'}
                                                            {(matchData?.serverPort || matchData?.server?.port) && `:${matchData?.serverPort || matchData?.server?.port}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="opacity-60">Password:</span>
                                                        <span className="font-bold select-all">{matchData?.serverPassword || 'No password'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="opacity-60">Map:</span>
                                                        <span className="font-bold">{matchData?.mapName || matchData?.selectedMap || 'Unknown Map'}</span>
                                                    </div>
                                                </div>

                                                {/* TEAM ROSTER */}
                                                {matchData?.players && matchData.players.length > 0 && (
                                                    <div className="bg-black/20 p-4 rounded-lg">
                                                        <div className="text-center text-xs font-bold uppercase tracking-wider opacity-75 mb-3">
                                                            👥 Team Assignments
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* Team A */}
                                                            <div className="space-y-2">
                                                                <div className="text-center text-xs font-bold text-blue-400 uppercase">
                                                                    🔵 Team A (Survivors)
                                                                </div>
                                                                {matchData.players
                                                                    .filter((p: any) => p.team === 'TEAM_A')
                                                                    .map((p: any) => (
                                                                        <div key={p.userId} className="flex items-center gap-2 bg-blue-500/20 rounded px-2 py-1 text-xs">
                                                                            {p.user?.image && (
                                                                                <img src={p.user.image} alt="" className="w-5 h-5 rounded-full" />
                                                                            )}
                                                                            <span className="truncate flex-1">{p.user?.name || 'Player'}</span>
                                                                            <span className="text-blue-300 font-mono text-[10px]">{p.user?.rating || '?'}</span>
                                                                        </div>
                                                                    ))
                                                                }
                                                            </div>
                                                            {/* Team B */}
                                                            <div className="space-y-2">
                                                                <div className="text-center text-xs font-bold text-red-400 uppercase">
                                                                    🔴 Team B (Infected)
                                                                </div>
                                                                {matchData.players
                                                                    .filter((p: any) => p.team === 'TEAM_B')
                                                                    .map((p: any) => (
                                                                        <div key={p.userId} className="flex items-center gap-2 bg-red-500/20 rounded px-2 py-1 text-xs">
                                                                            {p.user?.image && (
                                                                                <img src={p.user.image} alt="" className="w-5 h-5 rounded-full" />
                                                                            )}
                                                                            <span className="truncate flex-1">{p.user?.name || 'Player'}</span>
                                                                            <span className="text-red-300 font-mono text-[10px]">{p.user?.rating || '?'}</span>
                                                                        </div>
                                                                    ))
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Connection Instructions */}
                                                <div className="bg-black/30 p-4 rounded-lg space-y-3">
                                                    <div className="font-bold text-sm uppercase tracking-wide opacity-75">📋 How to Connect:</div>
                                                    <ol className="text-sm space-y-2 list-decimal list-inside opacity-90">
                                                        <li><strong>Open L4D2</strong> and go to the main menu</li>
                                                        <li>Press <code className="bg-black/30 px-1 rounded">~</code> to open console</li>
                                                        <li>Copy and paste the command below:</li>
                                                    </ol>
                                                    <div className="bg-black/40 p-3 rounded font-mono text-xs select-all break-all">
                                                        connect {matchData?.serverIp || matchData?.server?.ipAddress || '...'}{(matchData?.serverPort || matchData?.server?.port) && `:${matchData?.serverPort || matchData?.server?.port}`}{matchData?.serverPassword && `; password ${matchData?.serverPassword}`}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const ip = matchData?.serverIp || matchData?.server?.ipAddress || '';
                                                            const port = matchData?.serverPort || matchData?.server?.port || '';
                                                            const pwd = matchData?.serverPassword || '';
                                                            const cmd = `connect ${ip}${port ? `:${port}` : ''}${pwd ? `; password ${pwd}` : ''}`;
                                                            navigator.clipboard.writeText(cmd);
                                                        }}
                                                        className="w-full bg-black/30 hover:bg-black/40 py-2 rounded font-bold text-sm transition-colors"
                                                    >
                                                        📋 Copy Connect Command
                                                    </button>
                                                    <ol start={4} className="text-sm space-y-2 list-decimal list-inside opacity-90">
                                                        <li>Once connected, type <code className="bg-black/30 px-1 rounded">!ready</code> in chat</li>
                                                        <li>Wait for all 8 players to ready up</li>
                                                    </ol>
                                                </div>

                                                {/* Tips */}
                                                <div className="bg-black/20 p-3 rounded-lg text-xs opacity-75 space-y-1">
                                                    <div>💡 <strong>Tip:</strong> If you can&apos;t connect, check your firewall settings</div>
                                                    <div>⚠️ <strong>Note:</strong> ZoneMod config will load automatically</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>


                            </div>                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
