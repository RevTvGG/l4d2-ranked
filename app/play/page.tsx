'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { joinQueue, leaveQueue, getQueueStatus } from '@/app/actions/queue';
import { acceptMatch, voteMap, getMatch } from '@/app/actions/match';
import { getOnlineUsers } from '@/app/actions/chat';
import { redirect } from 'next/navigation';
import GlobalChat from '@/components/GlobalChat';
import Link from 'next/link';

export default function PlayPage() {
    const { data: session, status } = useSession();
    const [queueStatus, setQueueStatus] = useState<any>(null);
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/');
        }
    }, [status]);

    // Poll queue status and online users every 2 seconds
    useEffect(() => {
        if (status !== 'authenticated') return;

        const fetchData = async () => {
            const status = await getQueueStatus();
            setQueueStatus(status);

            if (status?.match) {
                const matchData = await getMatch(status.match.id);
                setMatch(matchData);
            }

            const users = await getOnlineUsers();
            setOnlineUsers(users);
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);

        return () => clearInterval(interval);
    }, [status]);

    const handleFindMatch = async () => {
        setLoading(true);
        const result = await joinQueue();
        if (result.error) {
            alert(result.error);
        }
        setLoading(false);
    };

    const handleCancelQueue = async () => {
        setLoading(true);
        await leaveQueue();
        setQueueStatus(null);
        setLoading(false);
    };

    const handleAcceptMatch = async () => {
        if (!match) return;
        setLoading(true);
        await acceptMatch(match.id);
        setLoading(false);
    };

    const handleVoteMap = async (mapId: string) => {
        if (!match) return;
        setLoading(true);
        await voteMap(match.id, mapId);
        setLoading(false);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-2xl">Loading...</div>
            </div>
        );
    }

    // Calculate real stats
    const totalOnline = onlineUsers.length;
    const activeMatches = 0; // TODO: Get from API

    return (
        <div className="min-h-screen bg-black text-white pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Queue Status Card */}
                        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="text-3xl">🔥</div>
                                <h2 className="text-2xl font-bold">Queue Status</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Players Online</p>
                                    <p className="text-4xl font-bold text-[#a3ff12]">{totalOnline}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Active Matches</p>
                                    <p className="text-4xl font-bold text-[#a3ff12]">{activeMatches}</p>
                                </div>
                            </div>

                            {/* Find Match Button or Queue Status */}
                            {!queueStatus ? (
                                <button
                                    onClick={handleFindMatch}
                                    disabled={loading}
                                    className="w-full py-4 bg-[#a3ff12] hover:bg-[#8fd610] text-black disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-bold text-xl transition-colors"
                                >
                                    {loading ? 'SEARCHING...' : 'FIND MATCH'}
                                </button>
                            ) : !match ? (
                                <div className="space-y-4">
                                    <div className="bg-[#0a0a0a] rounded-lg p-6 border border-gray-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold">🔍 Searching for players...</h3>
                                            <span className="text-[#a3ff12] font-bold">
                                                {queueStatus.totalInQueue}/8
                                            </span>
                                        </div>

                                        {/* Player Avatars */}
                                        <div className="flex space-x-2 mb-4">
                                            {queueStatus.currentUser && (
                                                <a
                                                    href={`https://steamcommunity.com/profiles/${session?.user?.steamId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <img
                                                        src={queueStatus.currentUser.image || '/default-avatar.png'}
                                                        className="w-12 h-12 rounded-full border-2 border-[#a3ff12]"
                                                        alt={queueStatus.currentUser.name}
                                                    />
                                                </a>
                                            )}
                                            {[...Array(7)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCancelQueue}
                                        disabled={loading}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg font-bold"
                                    >
                                        CANCEL SEARCH
                                    </button>
                                </div>
                            ) : (
                                <MatchFound match={match} onAccept={handleAcceptMatch} onVoteMap={handleVoteMap} loading={loading} />
                            )}
                        </div>

                        {/* Server News */}
                        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="text-2xl">📢</div>
                                <h2 className="text-xl font-bold">Server News</h2>
                            </div>
                            <div className="space-y-3">
                                <NewsItem
                                    title="Season 1 Ending Soon!"
                                    description="Don't forget to join our Discord for tournament announcements. Season 1 ends in 2 weeks!"
                                    date="Dec 24, 2025"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - 1 column */}
                    <div className="space-y-6">
                        {/* Online Players */}
                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-[#a3ff12] rounded-full"></div>
                                    <h3 className="text-lg font-bold">Online Players</h3>
                                </div>
                                <span className="text-gray-400 text-sm">{totalOnline} Active</span>
                            </div>

                            <div className="space-y-2">
                                {onlineUsers.slice(0, 10).map((user: any, i: number) => (
                                    <Link
                                        key={i}
                                        href={`/profile/${user.name}`}
                                        className="flex items-center space-x-2 p-2 bg-[#0a0a0a] rounded hover:bg-gray-900 transition-colors"
                                    >
                                        <img
                                            src={user.image || '/default-avatar.png'}
                                            className="w-8 h-8 rounded-full"
                                            alt={user.name}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-[#a3ff12]">ONLINE</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
                            <h3 className="text-lg font-bold mb-3">Your Stats</h3>
                            <div className="space-y-2">
                                <StatRow label="ELO Rating" value="1000" color="text-[#a3ff12]" />
                                <StatRow label="Wins" value="0" color="text-green-400" />
                                <StatRow label="Losses" value="0" color="text-red-400" />
                                <StatRow label="Win Rate" value="0%" color="text-blue-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Chat - Full Width Below */}
                <div className="mt-6">
                    <GlobalChat />
                </div>
            </div>
        </div>
    );
}

// Components
function MatchFound({ match, onAccept, onVoteMap, loading }: any) {
    const maps = [
        { id: 'c1m1_hotel', name: 'Dead Center' },
        { id: 'c2m1_highway', name: 'Dark Carnival' },
        { id: 'c5m1_waterfront', name: 'The Parish' },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-green-900 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-3">✅ Match Found!</h3>

                {!match.selectedMap ? (
                    <>
                        <p className="mb-3 text-sm">Vote for a map:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {maps.map((map) => (
                                <button
                                    key={map.id}
                                    onClick={() => onVoteMap(map.id)}
                                    disabled={loading}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-bold"
                                >
                                    {map.name}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-lg">Map: {maps.find(m => m.id === match.selectedMap)?.name}</p>
                )}
            </div>

            <button
                onClick={onAccept}
                disabled={loading}
                className="w-full py-3 bg-[#a3ff12] hover:bg-[#8fd610] text-black disabled:bg-gray-700 rounded-lg font-bold"
            >
                ACCEPT MATCH
            </button>
        </div>
    );
}

function NewsItem({ title, description, date }: { title: string; description: string; date: string }) {
    return (
        <div className="p-3 bg-[#0a0a0a] rounded border-l-2 border-[#a3ff12]">
            <h4 className="font-bold text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-400 mb-1">{description}</p>
            <p className="text-xs text-gray-600">{date}</p>
        </div>
    );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">{label}</span>
            <span className={`font-bold ${color}`}>{value}</span>
        </div>
    );
}
