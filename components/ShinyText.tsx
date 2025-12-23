export function ShinyText({ text, theme = "DEFAULT", className = "" }: { text: string, theme?: string, className?: string }) {
    if (theme === "DEFAULT") return <span className={className}>{text}</span>;

    const gradients: Record<string, string> = {
        GOLD: "from-yellow-200 via-yellow-500 to-yellow-200 text-yellow-500",
        DIAMOND: "from-cyan-200 via-cyan-500 to-cyan-200 text-cyan-400",
        RUBY: "from-red-300 via-red-600 to-red-300 text-red-500",
        EMERALD: "from-emerald-300 via-emerald-600 to-emerald-300 text-emerald-500",
        VOID: "from-purple-300 via-purple-600 to-purple-300 text-purple-500",
    };

    const gradientClass = gradients[theme] || "";

    return (
        <span
            className={`bg-gradient-to-r ${gradientClass} bg-[length:200%_auto] animate-shine bg-clip-text text-transparent ${className}`}
        >
            {text}
        </span>
    );
}
