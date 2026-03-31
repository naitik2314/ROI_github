"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import MapBackground from "./MapBackground";
import CompanySearch from "./CompanySearch";
import CompanyStats from "./CompanyStats";
import FactChip from "./FactChip";
import factsData from "../content/facts.json";
import { getCompanyData, CompanyData, getCompanyLocation } from "@/app/actions";
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
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-6 left-6 z-50 flex items-center gap-3 select-none glass-card px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-default"
        >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6EE7F9] to-[#A78BFA] flex items-center justify-center shadow-[0_0_20px_rgba(110,231,249,0.4)]">
                <Activity size={18} className="text-[#030614]" strokeWidth={2.5} />
            </div>
            <span className="font-outfit font-semibold tracking-tight text-white/95 text-base hidden md:block">
                Health<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6EE7F9] to-[#A78BFA]">ROI</span>
            </span>
        </motion.div>
    );
}

// Auth controls in top right
function AuthControls({ session }: { session: any }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
            className="absolute top-6 right-6 z-50"
        >
            {session ? (
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-2">
                        {session.user?.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-7 h-7 rounded-full ring-2 ring-[#A78BFA]/40"
                            />
                        ) : (
                            <UserCircle size={22} className="text-white/60" />
                        )}
                        <span className="text-sm text-white/90 font-medium hidden md:block font-outfit">{session.user?.name?.split(' ')[0]}</span>
                    </div>
                    <div className="w-[1px] h-5 bg-white/15" />
                    <button
                        onClick={() => signOut()}
                        className="text-white/40 hover:text-red-400 transition-colors"
                        title="Sign Out"
                        aria-label="Sign out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            ) : (
                <a
                    href="/login"
                    className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-all px-5 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-[#6EE7F9]/30 shadow-[0_0_30px_rgba(0,0,0,0.5)] font-outfit"
                >
                    <UserCircle size={18} />
                    <span>Sign In</span>
                </a>
            )}
        </motion.div>
    );
}

const EXAMPLE_COMPANIES = ["Google", "Microsoft", "Amazon", "Apple", "JPMorgan"];

export default function Hero() {
    const { data: session } = useSession();
    const [companyData, setCompanyData] = useState<CompanyData | null>(null);
    const [viewMode, setViewMode] = useState<'landing' | 'details'>('landing');
    const [loadingStage, setLoadingStage] = useState<'idle' | 'flash' | 'hex_layer' | 'point_layer' | 'complete'>('idle');
    const [tempLocation, setTempLocation] = useState<{ state?: string, county?: string, coordinates?: {lat: number, lng: number} } | null>(null);

    const handleSearch = async (query: string) => {
        // Reset state
        setCompanyData(null);
        setTempLocation(null);
        setViewMode('landing');
        setLoadingStage('flash');
        
        // Tier 1: Flash Location Fetch
        const loc = await getCompanyLocation(query);
        if (loc) {
            setTempLocation({
                state: loc.location.state,
                county: loc.location.county,
                coordinates: loc.location.coordinates
            });
        }
        
        // Tier 2: Sequence visual layers + parallel data fetch
        setLoadingStage('hex_layer');
        
        // Progress to point_layer purely for UX after a short delay
        const pointLayerTimeout = setTimeout(() => {
            setLoadingStage('point_layer');
        }, 1800);

        const data = await getCompanyData(query);
        clearTimeout(pointLayerTimeout);

        if (data) {
            setCompanyData(data);
            setLoadingStage('complete');
            setViewMode('details');
        } else {
            setLoadingStage('idle');
        }
    };

    const handleReset = () => {
        setViewMode('landing');
        setLoadingStage('idle');
        setCompanyData(null);
        setTempLocation(null);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        },
        exit: {
            opacity: 0,
            y: -30,
            filter: "blur(12px)",
            transition: { duration: 0.6, ease: "easeInOut", staggerChildren: 0.05, staggerDirection: -1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
        show: { 
            opacity: 1, 
            y: 0, 
            filter: "blur(0px)",
            transition: { duration: 0.8, ease: "easeOut" } 
        },
        exit: { opacity: 0, y: -20, filter: "blur(8px)", transition: { duration: 0.4 } }
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
                focusedState={companyData?.location.state || tempLocation?.state}
                focusedCounty={companyData?.location.county || tempLocation?.county}
                companyLocation={companyData?.location.coordinates || tempLocation?.coordinates}
                zoomMultiplier={viewMode === 'details' ? 1 : 1}
                loadingStage={loadingStage}
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
                    {viewMode === 'landing' && loadingStage === 'idle' ? (
                        <motion.div
                            key="landing-content"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="space-y-6 w-full flex flex-col items-center"
                        >
                            {/* Badge */}
                            <motion.div
                                variants={itemVariants}
                                className="flex items-center gap-2.5 bg-[#6EE7F9]/10 border border-[#6EE7F9]/20 px-4 py-2 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(110,231,249,0.15)]"
                            >
                                <Zap size={14} className="text-[#6EE7F9]" />
                                <span className="text-[13px] font-semibold text-[#6EE7F9] tracking-[0.15em] uppercase font-outfit">AI-Powered Analysis</span>
                            </motion.div>

                            {/* Headline Group */}
                            <div className="space-y-6">
                                <motion.div variants={itemVariants}>
                                    <h1 className="text-7xl md:text-[7rem] font-bold tracking-tighter text-white leading-[0.95] font-outfit drop-shadow-2xl">
                                        Over{" "}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#A78BFA] drop-shadow-[0_0_40px_rgba(167,139,250,0.5)]">
                                            <AnimatedCounter end={1.14} />
                                        </span>
                                    </h1>
                                </motion.div>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-xl md:text-2xl text-white/60 font-light max-w-3xl mx-auto leading-relaxed"
                                >
                                    is spent annually in costs and lost productivity from{" "}
                                    <span className="text-white font-medium drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">preventable illness</span>
                                    {" "}— heart disease, stroke, diabetes, obesity, chronic kidney disease, and dental disease.
                                </motion.p>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-lg md:text-xl text-white/40 font-light max-w-xl mx-auto italic"
                                >
                                    How much is chronic disease costing <em className="text-white/60 font-medium not-italic">your</em> company?
                                </motion.p>
                            </div>

                            {/* Facts Row */}
                            <motion.div
                                variants={itemVariants}
                                className="flex flex-wrap items-center justify-center gap-3 mt-4"
                            >
                                {factsData.slice(0, 3).map((fact, i) => (
                                    <FactChip key={fact.id} label={fact.text} delay={0} />
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
                        {viewMode === 'landing' && loadingStage === 'idle' && (
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

                    {/* Progress Indicator Over Search */}
                    <AnimatePresence>
                        {loadingStage !== 'idle' && loadingStage !== 'complete' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute -top-12 left-0 right-0 flex justify-center z-40"
                            >
                                <div className="glass-card px-4 py-2 rounded-full border border-accent-start/30 bg-ink/80 backdrop-blur-md flex items-center gap-3 shadow-[0_0_20px_rgba(110,231,249,0.2)]">
                                    <div className="w-2 h-2 rounded-full bg-accent-start animate-ping" />
                                    <span className="text-sm font-medium text-accent-start tracking-wider">
                                        {loadingStage === 'flash' && "Locating Headquarters..."}
                                        {loadingStage === 'hex_layer' && "Analyzing Regional Matrix..."}
                                        {loadingStage === 'point_layer' && "Aggregating Health Data..."}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loadingStage === 'idle' && (
                        <CompanySearch onSearch={handleSearch} examples={EXAMPLE_COMPANIES} />
                    )}

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
