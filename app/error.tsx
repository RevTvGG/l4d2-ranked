'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Application Error</h2>
            <button
                className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}
