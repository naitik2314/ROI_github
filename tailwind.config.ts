import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                ink: "#080C17",
                inkLight: "#0F1525",
                offwhite: "#F7F8FA",
                accent: {
                    start: "#6EE7F9",
                    mid: "#8BB5FF",
                    end: "#A78BFA",
                },
                health: {
                    red: "#FF4D6D",
                    yellow: "#FFD166",
                    green: "#06D6A0",
                    blue: "#4CC9F0",
                }
            },
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-out forwards",
                "slide-up": "slideUp 0.5s ease-out forwards",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "float": "float 6s ease-in-out infinite",
                "aurora": "aurora-shift 8s ease-in-out infinite",
                "count-up": "countUp 1s ease-out forwards",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-8px)" },
                },
                countUp: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "grid-pattern": "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            },
            backgroundSize: {
                "grid": "40px 40px",
            },
            dropShadow: {
                "glow-accent": ["0 0 6px rgba(110,231,249,0.35)", "0 0 20px rgba(110,231,249,0.15)"],
                "glow-purple": ["0 0 6px rgba(167,139,250,0.35)", "0 0 20px rgba(167,139,250,0.15)"],
            },
            boxShadow: {
                "inner-glow": "inset 0 0 30px rgba(110,231,249,0.05)",
                "panel": "0 25px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            }
        },
    },
    plugins: [],
};
export default config;
