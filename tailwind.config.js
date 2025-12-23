/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                "brand-green": "#ccff00",
            },
            animation: {
                shine: "shine 3s linear infinite",
            },
            keyframes: {
                shine: {
                    "0%": { backgroundPosition: "200% center" },
                    "100%": { backgroundPosition: "-200% center" },
                },
            },
        },
    },
    plugins: [],
};
