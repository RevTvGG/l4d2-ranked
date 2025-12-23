import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
            <h2 className="text-4xl font-black mb-4">404 - Not Found</h2>
            <p className="mb-8 text-zinc-400">Could not find requested resource</p>
            <Link href="/" className="px-4 py-2 bg-brand-green text-black font-bold rounded">
                Return Home
            </Link>
        </div>
    );
}
