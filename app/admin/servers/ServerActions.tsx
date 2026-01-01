'use client';

import { forceReleaseServer } from '@/app/actions/admin';
import { useState } from 'react';

export function ForceReleaseButton({ serverId }: { serverId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleRelease = async () => {
        if (!confirm('Are you sure you want to force release this server? Any active match will be CANCELLED.')) return;

        setIsLoading(true);
        const result = await forceReleaseServer(serverId);
        setIsLoading(false);

        if (result.error) {
            alert('Error releasing server: ' + result.error);
        }
    };

    return (
        <button
            onClick={handleRelease}
            disabled={isLoading}
            className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
            {isLoading ? 'Releasing...' : 'Force Release'}
        </button>
    );
}
