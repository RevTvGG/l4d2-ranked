'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface MatchPlayer {
    id: string;
    name: string;
    image: string | null;
    steamId: string | null;
}

interface MatchHistoryEntry {
    matchId: string;
    mapName: string;
    date: string;
    result: 'WIN' | 'LOSS' | 'DRAW';
    eloChange: number;
    team: 'A' | 'B';
    teammates: MatchPlayer[];
    opponents: MatchPlayer[];
}

interface MatchHistoryProps {
    matches: MatchHistoryEntry[];
    isPremium: boolean;
    isOwner: boolean;
}

export function MatchHistory({ matches, isPremium, isOwner }: MatchHistoryProps) {
    const [showAll, setShowAll] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [reportingMatch, setReportingMatch] = useState<string | null>(null);
    const [reportingPlayer, setReportingPlayer] = useState<MatchPlayer | null>(null);

    const displayedMatches = showAll ? matches : matches.slice(0, 5);

    const copyMatchId = (matchId: string) => {
        navigator.clipboard.writeText(matchId);
        setCopiedId(matchId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Non-premium view with blur
    if (!isPremium) {
        return (
            <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    🔒 Match History
                    <span className="text-xs bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">
                        PREMIUM
                    </span>
                </h3>
                <div className="relative">
                    {/* Blurred preview */}
                    <div className="space-y-3 filter blur-sm pointer-events-none select-none">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-lg"></div>
                                        <div>
                                            <div className="h-4 w-24 bg-zinc-700 rounded"></div>
                                            <div className="h-3 w-16 bg-zinc-800 rounded mt-1"></div>
                                        </div>
                                    </div>
                                    <div className="h-6 w-16 bg-green-500/20 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Overlay with upgrade CTA */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
                        <div className="text-center p-6">
                            <div className="text-4xl mb-3">⭐</div>
                            <h4 className="text-xl font-bold text-white mb-2">Premium Feature</h4>
                            <p className="text-zinc-400 text-sm mb-4 max-w-[250px]">
                                View your complete match history, request demos, and report players
                            </p>
                            <Link
                                href="/premium"
                                className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all"
                            >
                                Upgrade to Premium
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Premium view with full functionality
    return (
        <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                📜 Match History
                {isOwner && (
                    <span className="text-xs text-zinc-500 font-normal">
                        Last {matches.length} matches
                    </span>
                )}
            </h3>

            {matches.length === 0 ? (
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-8 text-center">
                    <p className="text-zinc-500">No matches played yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedMatches.map((match) => (
                        <div
                            key={match.matchId}
                            className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                        >
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {/* Result Badge */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${match.result === 'WIN'
                                            ? 'bg-green-500/20 text-green-400'
                                            : match.result === 'LOSS'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-zinc-500/20 text-zinc-400'
                                        }`}>
                                        {match.result === 'WIN' ? '✓' : match.result === 'LOSS' ? '✗' : '—'}
                                    </div>

                                    <div>
                                        <div className="font-medium text-white flex items-center gap-2">
                                            {match.result}
                                            <span className={`text-sm ${match.eloChange > 0
                                                    ? 'text-green-400'
                                                    : match.eloChange < 0
                                                        ? 'text-red-400'
                                                        : 'text-zinc-500'
                                                }`}>
                                                {match.eloChange > 0 ? '+' : ''}{match.eloChange} ELO
                                            </span>
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {match.mapName} • {formatDate(match.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Match ID */}
                                <button
                                    onClick={() => copyMatchId(match.matchId)}
                                    className="text-xs bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
                                >
                                    <span className="font-mono truncate max-w-[100px]">
                                        {match.matchId.slice(0, 8)}...
                                    </span>
                                    {copiedId === match.matchId ? (
                                        <span className="text-green-400">✓</span>
                                    ) : (
                                        <span>📋</span>
                                    )}
                                </button>
                            </div>

                            {/* Teams Row */}
                            <div className="flex items-center gap-4 text-sm">
                                {/* Teammates */}
                                <div className="flex-1">
                                    <div className="text-xs text-zinc-500 mb-2">Your Team</div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {match.teammates.slice(0, 3).map((player) => (
                                            <Link
                                                key={player.id}
                                                href={`/profile/${encodeURIComponent(player.name)}`}
                                                className="flex items-center gap-1.5 bg-zinc-800/50 rounded-lg px-2 py-1 hover:bg-zinc-700/50 transition-colors"
                                            >
                                                <Image
                                                    src={player.image || '/default_avatar.jpg'}
                                                    alt={player.name}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full"
                                                />
                                                <span className="text-zinc-300 text-xs truncate max-w-[60px]">
                                                    {player.name}
                                                </span>
                                            </Link>
                                        ))}
                                        {match.teammates.length > 3 && (
                                            <span className="text-zinc-500 text-xs">
                                                +{match.teammates.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-zinc-600 font-bold">VS</div>

                                {/* Opponents */}
                                <div className="flex-1">
                                    <div className="text-xs text-zinc-500 mb-2 text-right">Opponents</div>
                                    <div className="flex items-center gap-1 flex-wrap justify-end">
                                        {match.opponents.slice(0, 3).map((player) => (
                                            <Link
                                                key={player.id}
                                                href={`/profile/${encodeURIComponent(player.name)}`}
                                                className="flex items-center gap-1.5 bg-zinc-800/50 rounded-lg px-2 py-1 hover:bg-zinc-700/50 transition-colors"
                                            >
                                                <Image
                                                    src={player.image || '/default_avatar.jpg'}
                                                    alt={player.name}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full"
                                                />
                                                <span className="text-zinc-300 text-xs truncate max-w-[60px]">
                                                    {player.name}
                                                </span>
                                            </Link>
                                        ))}
                                        {match.opponents.length > 3 && (
                                            <span className="text-zinc-500 text-xs">
                                                +{match.opponents.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Row */}
                            {isOwner && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                    <button
                                        onClick={() => {
                                            copyMatchId(match.matchId);
                                            alert(`Match ID copied! Send this ID to an admin to request the demo file:\n\n${match.matchId}`);
                                        }}
                                        className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
                                    >
                                        📹 Request Demo
                                    </button>

                                    {/* Report Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setReportingMatch(reportingMatch === match.matchId ? null : match.matchId)}
                                            className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                                        >
                                            🚩 Report Player
                                        </button>

                                        {reportingMatch === match.matchId && (
                                            <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-10 min-w-[180px] py-1">
                                                <div className="px-3 py-2 text-xs text-zinc-500 border-b border-white/5">
                                                    Select player to report:
                                                </div>
                                                {match.opponents.map((player) => (
                                                    <Link
                                                        key={player.id}
                                                        href={`/profile/${encodeURIComponent(player.name)}?report=true&matchId=${match.matchId}`}
                                                        className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 transition-colors"
                                                        onClick={() => setReportingMatch(null)}
                                                    >
                                                        <Image
                                                            src={player.image || '/default_avatar.jpg'}
                                                            alt={player.name}
                                                            width={24}
                                                            height={24}
                                                            className="rounded-full"
                                                        />
                                                        <span className="text-white text-sm">{player.name}</span>
                                                    </Link>
                                                ))}
                                                {match.teammates.map((player) => (
                                                    <Link
                                                        key={player.id}
                                                        href={`/profile/${encodeURIComponent(player.name)}?report=true&matchId=${match.matchId}`}
                                                        className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 transition-colors"
                                                        onClick={() => setReportingMatch(null)}
                                                    >
                                                        <Image
                                                            src={player.image || '/default_avatar.jpg'}
                                                            alt={player.name}
                                                            width={24}
                                                            height={24}
                                                            className="rounded-full"
                                                        />
                                                        <span className="text-white text-sm">{player.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Show More Button */}
                    {matches.length > 5 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="w-full py-3 bg-zinc-800/50 text-zinc-400 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors text-sm font-medium"
                        >
                            {showAll ? 'Show Less' : `Show All (${matches.length} matches)`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
