'use client';

import { useState } from 'react';

export default function SetupServerPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const setupServer = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/setup-server', {
                method: 'POST',
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ error: String(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
                <h1 className="text-2xl font-bold text-white mb-6">
                    Setup Game Server
                </h1>

                <button
                    onClick={setupServer}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded transition"
                >
                    {loading ? 'Setting up...' : 'Add Server to Database'}
                </button>

                {result && (
                    <div className="mt-6 p-4 bg-gray-700 rounded">
                        <pre className="text-sm text-white overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
