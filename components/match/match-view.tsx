'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Copy, RefreshCw, Trophy, Shield, PlayCircle } from 'lucide-react';
import MatchChat from './match-chat';
import { toast } from 'sonner';
import { PremiumBadge } from '../PremiumBadge';
import { ShinyText } from '../ShinyText';

interface Player {
    id: string;
    user: {
        name: string;
        image?: string;
        rating: number;
        steamId: string;
        isPremium?: boolean;
        profileTheme?: string;
    };
    team: 'TEAM_A' | 'TEAM_B';
}

interface Match {
    id: string;
    status: string;
    mapName: string | null;
    selectedMap: string | null;
    serverIp: string | null;
    serverPort: number | null;
    teamAScore: number;
    teamBScore: number;
    players: Player[];
    winnerTeam: string | null;
}

interface MatchViewProps {
    initialMatch: Match;
}

export default function MatchView({ initialMatch }: MatchViewProps) {
    const router = useRouter();
    const [match, setMatch] = useState<Match>(initialMatch);

    // Filter players by team
    const teamAPlayers = match.players.filter(p => p.team === 'TEAM_A');
    const teamBPlayers = match.players.filter(p => p.team === 'TEAM_B');

    // Calculate average ELO
    const teamAAvgElo = Math.round(teamAPlayers.reduce((acc, p) => acc + p.user.rating, 0) / (teamAPlayers.length || 1));
    const teamBAvgElo = Math.round(teamBPlayers.reduce((acc, p) => acc + p.user.rating, 0) / (teamBPlayers.length || 1));

    // Construct connect string
    const connectString = match.serverIp ? `connect ${match.serverIp}${match.serverPort ? `:${match.serverPort}` : ''}` : '';
    const steamLink = match.serverIp ? `steam://connect/${match.serverIp}${match.serverPort ? `:${match.serverPort}` : ''}` : '';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    // Poll for match updates
    useEffect(() => {
        if (match.status === 'COMPLETED' || match.status === 'CANCELLED') return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/match/${match.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setMatch(data);
                }
            } catch (error) {
                console.error('Failed to update match data', error);
            }
        }, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, [match.id, match.status]);

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Match #{match.id.slice(0, 8)}</h1>
                    <div className="flex items-center gap-2 mt-2 text-gray-400">
                        <span className="font-medium text-white">{match.selectedMap || match.mapName || 'Unknown Map'}</span>
                        <span>•</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                            ${match.status === 'IN_PROGRESS' ? 'bg-green-500/20 text-green-500' :
                                match.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400' :
                                    match.status === 'WAITING_FOR_PLAYERS' ? 'bg-yellow-500/20 text-yellow-500' :
                                        'bg-white/10 text-white'}`}>
                            {match.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
                {match.status === 'COMPLETED' && (
                    <div className="bg-yellow-500/10 border-yellow-500/20 border px-4 py-2 rounded-md flex items-center gap-2 text-yellow-500">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold">
                            Winner: {match.winnerTeam === 'TEAM_A' ? 'Team A' : 'Team B'}
                        </span>
                    </div>
                )}
            </div>

            {/* Server Connection */}
            {(match.status === 'WAITING_FOR_PLAYERS' || match.status === 'IN_PROGRESS') && match.serverIp && (
                <div className="border border-green-500/20 bg-green-500/5 rounded-lg overflow-hidden">
                    <div className="p-6 pb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-green-500">
                            <PlayCircle className="w-5 h-5" />
                            Join Server
                        </h3>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                className="flex-1 h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                                onClick={() => window.location.href = steamLink}
                            >
                                Connect Now
                            </button>
                            <div className="flex items-center gap-2 flex-[2] bg-black/40 border border-white/10 rounded-md px-4 h-12">
                                <code className="flex-1 font-mono text-sm text-gray-300">{connectString}</code>
                                <button
                                    className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
                                    onClick={() => copyToClipboard(connectString)}
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 bg-black/40 p-4 rounded-md text-sm border border-white/5">
                            <p className="font-semibold text-gray-200">Instructions:</p>
                            <ol className="list-decimal list-inside space-y-1 text-gray-400 ml-1">
                                <li>Click <span className="font-medium text-white">Connect Now</span> or paste the command in console</li>
                                <li>Once connected, type <code className="bg-white/10 px-1 py-0.5 rounded text-white">!match</code> in chat</li>
                                <li>Select <span className="font-medium text-white">ZoneMod 2.9</span> from the menu</li>
                                <li>Type <code className="bg-white/10 px-1 py-0.5 rounded text-white">!ready</code> when you are ready to play</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team A */}
                <div className={`bg-gray-900/50 rounded-lg border ${match.winnerTeam === 'TEAM_A' ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'border-white/10'}`}>
                    <div className="p-6 flex flex-row justify-between items-center pb-4 border-b border-white/5">
                        <div>
                            <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
                                <Shield className="w-5 h-5 text-blue-500" />
                                Team A
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Avg ELO: {teamAAvgElo}</p>
                        </div>
                        <div className="text-3xl font-bold text-white">{match.teamAScore}</div>
                    </div>
                    <div className="p-6 space-y-4">
                        {teamAPlayers.map(player => (
                            <Link href={`/profile/${player.user.name}`} key={player.id} className="flex items-center justify-between group hover:bg-white/5 p-2 rounded-lg -mx-2 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border ${player.user.isPremium ? 'border-amber-400' : 'border-white/10'} group-hover:border-blue-500/50 transition-colors`}>
                                        {player.user.image ? (
                                            <img src={player.user.image} alt={player.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-white">{player.user.name.slice(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium leading-none text-gray-200 group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                                            {player.user.isPremium ? (
                                                <ShinyText text={player.user.name} theme={player.user.profileTheme} />
                                            ) : (
                                                player.user.name
                                            )}
                                            {player.user.isPremium && <PremiumBadge theme={player.user.profileTheme} />}
                                        </span>
                                        <span className="text-xs text-gray-500">{player.user.rating} ELO</span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors">View Profile →</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Team B */}
                <div className={`bg-gray-900/50 rounded-lg border ${match.winnerTeam === 'TEAM_B' ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'border-white/10'}`}>
                    <div className="p-6 flex flex-row justify-between items-center pb-4 border-b border-white/5">
                        <div>
                            <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
                                <Shield className="w-5 h-5 text-red-500" />
                                Team B
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Avg ELO: {teamBAvgElo}</p>
                        </div>
                        <div className="text-3xl font-bold text-white">{match.teamBScore}</div>
                    </div>
                    <div className="p-6 space-y-4">
                        {teamBPlayers.map(player => (
                            <Link href={`/profile/${player.user.name}`} key={player.id} className="flex items-center justify-between group hover:bg-white/5 p-2 rounded-lg -mx-2 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border ${player.user.isPremium ? 'border-amber-400' : 'border-white/10'} group-hover:border-red-500/50 transition-colors`}>
                                        {player.user.image ? (
                                            <img src={player.user.image} alt={player.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-white">{player.user.name.slice(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium leading-none text-gray-200 group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                                            {player.user.isPremium ? (
                                                <ShinyText text={player.user.name} theme={player.user.profileTheme} />
                                            ) : (
                                                player.user.name
                                            )}
                                            {player.user.isPremium && <PremiumBadge theme={player.user.profileTheme} />}
                                        </span>
                                        <span className="text-xs text-gray-500">{player.user.rating} ELO</span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 group-hover:text-red-400 transition-colors">View Profile →</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Match Chat */}
            <MatchChat matchId={match.id} />
        </div>
    );
}
