'use client';

import { useState } from 'react';

export default function TestMatchPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [matchId, setMatchId] = useState('');

    const createAndStartMatch = async () => {
        setLoading(true);
        setResult(null);

        try {
            // 1. Crear match de prueba
            const createResponse = await fetch('/api/test/create-match', {
                method: 'POST',
            });
            const createData = await createResponse.json();

            if (!createData.success) {
                setResult({ error: 'Failed to create match', details: createData });
                setLoading(false);
                return;
            }

            setMatchId(createData.matchId);

            // 2. Iniciar match en el servidor
            const startResponse = await fetch('/api/server/start-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId: createData.matchId }),
            });

            const startData = await startResponse.json();
            setResult(startData);
        } catch (error) {
            setResult({ error: String(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-2xl w-full border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🎮 Test Match Simulator
                    </h1>
                    <p className="text-gray-400">
                        Simula una partida completa y verifica la integración RCON
                    </p>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={createAndStartMatch}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Iniciando partida...
                            </span>
                        ) : (
                            '🚀 Crear y Iniciar Partida'
                        )}
                    </button>

                    {matchId && (
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm text-gray-300">
                                <span className="font-semibold">Match ID:</span>{' '}
                                <code className="text-blue-400">{matchId}</code>
                            </p>
                        </div>
                    )}

                    {result && (
                        <div className={`p-6 rounded-lg ${result.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                            <h3 className={`text-lg font-bold mb-3 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                {result.success ? '✅ Partida Iniciada' : '❌ Error'}
                            </h3>

                            {result.success ? (
                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-300">
                                        <span className="font-semibold text-white">Mapa:</span>{' '}
                                        <code className="text-blue-400">{result.map}</code>
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-semibold text-white">Match ID:</span>{' '}
                                        <code className="text-blue-400">{result.matchId?.substring(0, 8)}...</code>
                                    </p>
                                    <div className="mt-4 p-4 bg-gray-800 rounded">
                                        <p className="text-green-400 font-semibold mb-2">🎯 Acciones ejecutadas:</p>
                                        <ul className="text-gray-300 space-y-1 text-sm">
                                            <li>✅ Conectado vía RCON al servidor</li>
                                            <li>✅ Mensaje enviado al chat del servidor</li>
                                            <li>✅ Mapa cambiado a: {result.map}</li>
                                            <li>✅ Estado del match actualizado</li>
                                        </ul>
                                    </div>
                                    <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded">
                                        <p className="text-blue-300 text-sm">
                                            💡 <span className="font-semibold">Conecta al servidor para verificar:</span>
                                            <br />
                                            <code className="text-blue-400">connect 50.20.249.93:9190</code>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-red-300">{result.error}</p>
                                    {result.details && (
                                        <pre className="text-xs text-gray-400 bg-gray-900 p-3 rounded overflow-auto max-h-40">
                                            {JSON.stringify(result.details, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                        <h4 className="text-white font-semibold mb-2">ℹ️ Información</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Este test crea un match en la base de datos</li>
                            <li>• Llama al API /api/server/start-match</li>
                            <li>• El servidor cambia el mapa vía RCON</li>
                            <li>• Verifica en el servidor L4D2 el resultado</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
