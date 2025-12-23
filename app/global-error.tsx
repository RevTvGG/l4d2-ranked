'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-950 text-white">
                    <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                    <p className="mb-4 text-zinc-400">{error.message}</p>
                    <button
                        className="px-4 py-2 bg-brand-green text-black font-bold rounded"
                        onClick={() => reset()}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
