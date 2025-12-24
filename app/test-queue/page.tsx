'use client';

import { useState, useEffect } from 'react';
import { joinQueue, leaveQueue, getQueueStatus } from '@/app/actions/queue';
import { acceptMatch, voteMap, getMatch, getAvailableMaps } from '@/app/actions/match';

export default function TestQueuePage() {
    const [queueStatus, setQueueStatus] = useState<any>(null);
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Actualizar estado cada 2 segundos
    useEffect(() => {
        const interval = setInterval(async () => {
            const status = await getQueueStatus();
            setQueueStatus(status);

            if (status?.match) {
                const matchData = await getMatch(status.match.id);
                setMatch(matchData);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleJoinQueue = async () => {
        setLoading(true);
        setMessage('');
        const result = await joinQueue();
        if (result.error) {
            setMessage(`❌ Error: ${result.error}`);
        } else {
            setMessage('✅ Te uniste a la cola!');
        }
        setLoading(false);
    };

    const handleLeaveQueue = async () => {
        setLoading(true);
        setMessage('');
        await leaveQueue();
        setMessage('✅ Saliste de la cola');
        setQueueStatus(null);
        setLoading(false);
    };

    const handleAcceptMatch = async () => {
        if (!match) return;
        setLoading(true);
        setMessage('');
        const result = await acceptMatch(match.id);
        if (result.error) {
            setMessage(`❌ Error: ${result.error}`);
        } else {
            setMessage('✅ Partida aceptada!');
        }
        setLoading(false);
    };

    const handleVoteMap = async (mapId: string) => {
        if (!match) return;
        setLoading(true);
        setMessage('');
        const result = await voteMap(match.id, mapId);
        if (result.error) {
            setMessage(`❌ Error: ${result.error}`);
        } else {
            setMessage(`✅ Votaste por ${mapId}`);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">🧪 Test de Matchmaking</h1>

                {/* Mensaje */}
                {message && (
                    <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                        {message}
                    </div>
                )}

                {/* Botones de cola */}
                <div className="mb-8 space-x-4">
                    <button
                        onClick={handleJoinQueue}
                        disabled={loading || queueStatus}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-bold"
                    >
                        {loading ? 'Cargando...' : 'Buscar Partida'}
                    </button>

                    <button
                        onClick={handleLeaveQueue}
                        disabled={loading || !queueStatus}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-bold"
                    >
                        Salir de Cola
                    </button>
                </div>

                {/* Estado de cola */}
                {queueStatus && !queueStatus.match && (
                    <div className="mb-8 p-6 bg-gray-800 rounded-lg">
                        <h2 className="text-2xl font-bold mb-4">🔍 Buscando Partida...</h2>
                        <p className="text-xl">
                            Jugadores en cola: <span className="text-green-400 font-bold">{queueStatus.totalInQueue}/8</span>
                        </p>
                        <div className="mt-4 flex space-x-2">
                            {/* Mostrar foto del usuario actual primero */}
                            {queueStatus.currentUser && (
                                <img
                                    src={queueStatus.currentUser.image || '/default-avatar.png'}
                                    className="w-12 h-12 rounded-full border-2 border-green-500"
                                    alt={queueStatus.currentUser.name}
                                    title={queueStatus.currentUser.name}
                                />
                            )}
                            {/* Resto de slots vacíos */}
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-12 h-12 rounded-full bg-gray-700"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Match encontrado */}
                {match && match.status === 'VETO' && (
                    <div className="mb-8 p-6 bg-gray-800 rounded-lg">
                        <h2 className="text-2xl font-bold mb-4">🎮 Partida Encontrada!</h2>

                        {/* Jugadores */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-blue-400">Equipo 1</h3>
                                {match.players.filter((p: any) => p.team === 1).map((p: any) => (
                                    <div key={p.id} className="flex items-center space-x-2 mb-2">
                                        <img src={p.user.image || '/default-avatar.png'} className="w-8 h-8 rounded-full" />
                                        <span>{p.user.name}</span>
                                        {p.accepted && <span className="text-green-400">✓</span>}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-red-400">Equipo 2</h3>
                                {match.players.filter((p: any) => p.team === 2).map((p: any) => (
                                    <div key={p.id} className="flex items-center space-x-2 mb-2">
                                        <img src={p.user.image || '/default-avatar.png'} className="w-8 h-8 rounded-full" />
                                        <span>{p.user.name}</span>
                                        {p.accepted && <span className="text-green-400">✓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botón aceptar */}
                        <button
                            onClick={handleAcceptMatch}
                            disabled={loading}
                            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-bold text-xl mb-6"
                        >
                            Aceptar Partida
                        </button>

                        {/* Votación de mapas */}
                        {match.selectedMap ? (
                            <div className="p-4 bg-green-900 rounded-lg">
                                <h3 className="text-xl font-bold mb-2">✅ Mapa Seleccionado:</h3>
                                <p className="text-2xl">{getAvailableMaps().find(m => m.id === match.selectedMap)?.name}</p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold mb-4">🗳️ Vota por un mapa:</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {getAvailableMaps().map((map) => (
                                        <button
                                            key={map.id}
                                            onClick={() => handleVoteMap(map.id)}
                                            disabled={loading}
                                            className="p-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-left"
                                        >
                                            <div className="font-bold">{map.name}</div>
                                            <div className="text-sm text-gray-400">{map.chapters} capítulos</div>
                                            <div className="text-xs text-green-400 mt-1">
                                                Votos: {match.mapVotes?.filter((v: any) => v.map === map.id).length || 0}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Match READY */}
                {match && match.status === 'READY' && (
                    <div className="mb-8 p-6 bg-green-900 rounded-lg">
                        <h2 className="text-2xl font-bold mb-4">🎯 Servidor Asignado!</h2>
                        <p className="text-xl mb-2">Mapa: {getAvailableMaps().find(m => m.id === match.selectedMap)?.name}</p>
                        <p className="text-gray-300">IP del servidor: {match.serverIp || 'Asignando...'}</p>
                        <p className="text-gray-300">Puerto: {match.serverPort || '...'}</p>
                        <p className="text-gray-300">Contraseña: {match.serverPassword || '...'}</p>
                    </div>
                )}

                {/* Debug info */}
                <details className="mt-8">
                    <summary className="cursor-pointer text-gray-400">Ver datos raw (debug)</summary>
                    <pre className="mt-4 p-4 bg-black rounded-lg text-xs overflow-auto">
                        {JSON.stringify({ queueStatus, match }, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
}
