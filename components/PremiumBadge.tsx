export function PremiumBadge({ theme = "DEFAULT" }: { theme?: string }) {
    // if (theme === "DEFAULT") return null; // Always show badge for premium users

    const colors: Record<string, string> = {
        GOLD: "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]",
        DIAMOND: "text-cyan-300 drop-shadow-[0_0_5px_rgba(103,232,249,0.5)]",
        RUBY: "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]",
        EMERALD: "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]",
        VOID: "text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]",
    };

    return (
        <span className={`text-lg ${colors[theme] || "text-yellow-400"}`} title="Premium Member">
            ★
        </span>
    );
}
