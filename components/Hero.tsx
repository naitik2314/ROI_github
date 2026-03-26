"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import MapBackground from "./MapBackground";
import CompanySearch from "./CompanySearch";
import CompanyStats from "./CompanyStats";
import FactChip from "./FactChip";
import factsData from "../content/facts.json";
import { getCompanyData, CompanyData } from "@/app/actions";
import HealthTrends from "./HealthTrends";
import { UserCircle, LogOut, Activity, Zap } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
    const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
    const display = useTransform(spring, (current) =>
        `$${current.toFixed(2)}T`
    );

    useEffect(() => {
        spring.set(end);
    }, [spring, end]);

    return <motion.span className="tabular-nums glow-text">{display}</motion.span>;
}

// Animated aurora blobs for background ambiance
function AuroraBg() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
                className="absolute -top-64 left-1/3 w-[700px] h-[700px] rounded-full opacity-[0.04] blur-[120px]"
                style={{
                    background: "radial-gradient(circle, #6EE7F9 0%, transparent 70%)",
                    animation: "aurora-shift 12s ease-in-out infinite"
                }}
            />
            <div
                className="absolute -bottom-32 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.035] blur-[120px]"
                style={{
                    background: "radial-gradient(circle, #A78BFA 0%, transparent 70%)",
                    animation: "aurora-shift 10s ease-in-out infinite reverse"
                }}
            />
        </div>
    );
}

// Top logo/wordmark
function Wordmark() {
    return (
        <div className="absolute top-6 left-6 z-50 flex items-center gap-2.5 select-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-start/80 to-accent-end/80 flex items-center justify-center shadow-lg shadow-accent-start/20">
                <Activity size={16} className="text-ink" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight text-white/90 text-sm hidden md:block">
                Health<span className="text-gradient">ROI</span>
            </span>
        </div>
    );
}

// Auth controls in top right
function AuthControls({ session }: { session: any }) {
    return (
        <div className="absolute top-6 right-6 z-50">
            {session ? (
                <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-full border border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        {session.user?.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-6 h-6 rounded-full ring-1 ring-accent-start/30"
                            />
                        ) : (
                            <UserCircle size={20} className="text-white/60" />
                        )}
                        <span className="text-xs text-white/80 font-medium hidden md:block">{session.user?.name?.split(' ')[0]}</span>
                    </div>
                    <div className="w-[1px] h-4 bg-white/10" />
                    <button
                        onClick={() => signOut()}
                        className="text-white/40 hover:text-red-400 transition-colors"
                        title="Sign Out"
                        aria-label="Sign out"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            ) : (
                <a
                    href="/login"
                    className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-all glass-card px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-accent-start/30"
                >
                    <UserCircle size={16} />
                    <span>Sign In</span>
                </a>
            )}
        </div>
    );
}

const EXAMPLE_COMPANIES = ["Google", "Microsoft", "Amazon", "Apple", "JPMorgan"];

export default function Hero() {
    const { data: session } = useSession();
    const [companyData, setCompanyData] = useState<CompanyData | null>(null);
    const [viewMode, setViewMode] = useState<'landing' | 'details'>('landing');

    const handleSearch = async (query: string) => {
        const data = await getCompanyData(query);
        if (data) {
            setCompanyData(data);
            setViewMode('details');
        }
    };

    const handleReset = () => {
        setViewMode('landing');
        setCompanyData(null);
    };

    return (
        <section
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 md:px-0 transition-all duration-1000"
            aria-label="Healthcare ROI Calculator"
        >
            {/* Aurora ambient background */}
            <AuroraBg />

            {/* Logo */}
            <Wordmark />

            {/* Auth Controls */}
            <AuthControls session={session} />

            {/* Map */}
            <MapBackground
                focusedState={companyData?.location.state}
                companyLocation={companyData?.location.coordinates}
                zoomMultiplier={viewMode === 'details' ? 1 : 1}
            />

            {/* Left Stats Panel */}
            <AnimatePresence>
                {viewMode === 'details' && companyData && (
                    <CompanyStats data={companyData} />
                )}
            </AnimatePresence>

            {/* Right Health Panel */}
            <AnimatePresence>
                {viewMode === 'details' && (
                    <HealthTrends isVisible={true} data={companyData} />
                )}
            </AnimatePresence>

            {/* Main Content Overlay */}
            <div className="relative z-30 w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-8 md:gap-10">

                <AnimatePresence mode="wait">
                    {viewMode === 'landing' ? (
                        <motion.div
                            key="landing-content"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6 w-full flex flex-col items-center"
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className="flex items-center gap-2 bg-accent-start/10 border border-accent-start/20 px-3 py-1.5 rounded-full"
                            >
                                <Zap size={12} className="text-accent-start" />
                                <span className="text-xs font-medium text-accent-start tracking-wide">AI-Powered Analysis</span>
                            </motion.div>

                            {/* Headline Group */}
                            <div className="space-y-5">
                                <motion.div
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                >
                                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-[1.05]">
                                        Over{" "}
                                        <span className="text-gradient drop-shadow-glow-accent">
                                            <AnimatedCounter end={1.14} />
                                        </span>
                                    </h1>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    className="text-lg md:text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed"
                                >
                                    is spent annually in costs and lost productivity from{" "}
                                    <span className="text-white/90 font-medium">preventable illness</span>
                                    {" "}— heart disease, stroke, diabetes, obesity, chronic kidney disease, and dental disease.
                                </motion.p>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                    className="text-base md:text-lg text-white/40 font-light max-w-xl mx-auto"
                                >
                                    How much is chronic disease costing <em>your</em> company?
                                </motion.p>
                            </div>

                            {/* Facts Row */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                className="flex flex-wrap items-center justify-center gap-2.5"
                            >
                                {factsData.slice(0, 3).map((fact, i) => (
                                    <FactChip key={fact.id} label={fact.text} delay={0.7 + (i * 0.1)} />
                                ))}
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details-spacer"
                            className="h-[15vh]"
                        />
                    )}
                </AnimatePresence>

                {/* Search Section */}
                <motion.div
                    layout
                    className="w-full mt-2 z-50"
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                >
                    <AnimatePresence>
                        {viewMode === 'landing' && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-3 text-xs font-semibold text-white/30 tracking-[0.2em] uppercase"
                            >
                                Calculate for your company
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <CompanySearch onSearch={handleSearch} examples={EXAMPLE_COMPANIES} />

                    {viewMode === 'details' && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={handleReset}
                            className="mt-4 text-white/30 hover:text-white/70 text-sm transition-colors"
                        >
                            ← Back to global view
                        </motion.button>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
