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
    // Poll for queue status and online users
    useEffect(() => {
        if (status !== 'authenticated') return;

        const poll = async () => {
            // Optimization: Don't poll if tab is in background
            if (document.hidden) return;

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
            <Navbar />

            {/* Hero Background Section */}
            <div className="relative min-h-screen flex flex-col">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('/l4d2_play_bg.jpg')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
                </div>

                {/* Content */}
                <div className="relative z-10 pt-32 pb-12 flex-1 flex flex-col items-center px-6">
                    <div className="w-full max-w-6xl space-y-8">
                        {/* Title Section */}
                        <div className="text-center space-y-4 mb-12">
                            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                                Matchmaking <span className="text-brand-green drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">Lobby</span>
                            </h1>
                            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                                Join the fight. Queue up and prove your worth.
                            </p>
                            <div className="flex items-center justify-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-zinc-900/60 px-4 py-2 rounded-full border border-white/10">
                                    <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>
                                    <span className="text-zinc-400">Online:</span>
                                    <span className="text-brand-green font-bold font-mono">{onlineCount}</span>
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

                                {/* QUEUE STATUS CARD */}
                                <div className="bg-zinc-900/70 border border-brand-green/20 p-6 rounded-2xl backdrop-blur-md shadow-[0_0_40px_-15px_rgba(74,222,128,0.3)] hover:border-brand-green/40 transition-all duration-300">
                                    <h3 className="font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                                        <span className="text-2xl">⚔️</span> Queue Status
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
                                                    className={`w-full py-4 font-black uppercase tracking-widest rounded-xl transition-all transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] ${inQueue
                                                        ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)] border border-red-400/30'
                                                        : 'bg-brand-green hover:bg-lime-400 text-black shadow-[0_0_40px_-5px_rgba(74,222,128,0.6)] border border-lime-300/30 animate-pulse'
                                                        }`}
                                                >
                                                    {inQueue ? '❌ Leave Queue' : '🎮 FIND MATCH'}
                                                </button>


                                            </>
                                        )}



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
