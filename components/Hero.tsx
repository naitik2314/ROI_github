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

function AnimatedCounter({ end, duration = 1.2 }: { end: number; duration?: number }) {
    const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
    const display = useTransform(spring, (current) =>
        `$${current.toFixed(1)}T`
    );

    useEffect(() => {
        spring.set(end);
    }, [spring, end]);

    return <motion.span className="tabular-nums">{display}</motion.span>;
}

import { UserCircle, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

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

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 md:px-0 transition-all duration-1000">
            {/* Top Right Auth Control */}
            <div className="absolute top-6 right-6 z-50">
                {session ? (
                    <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-full border border-white/10 bg-white/5">
                        <div className="flex items-center gap-2">
                            {session.user?.image ? (
                                <img src={session.user.image} alt={session.user.name || "User"} className="w-6 h-6 rounded-full ring-1 ring-white/20" />
                            ) : (
                                <UserCircle size={20} className="text-white/60" />
                            )}
                            <span className="text-xs text-white/80 font-medium hidden md:block">{session.user?.name?.split(' ')[0]}</span>
                        </div>
                        <div className="w-[1px] h-4 bg-white/10" />
                        <button
                            onClick={() => signOut()}
                            className="text-white/40 hover:text-white transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <a href="/api/auth/signin"
                        onClick={(e) => {
                            e.preventDefault();
                            // We use the NextAuth built-in flow or our custom page
                            // Since we built a custom page at /login, we should link there? 
                            // But auth.ts pages.signIn handles redirection usually if triggered by flow. 
                            // Explicit link to /login is safer.
                            window.location.href = "/login";
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors glass-card px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                    >
                        <UserCircle size={18} />
                        <span>Sign In</span>
                    </a>
                )}
            </div>

            <MapBackground
                focusedState={companyData?.location.state}
                companyLocation={companyData?.location.coordinates}
                zoomMultiplier={viewMode === 'details' ? 1 : 1} // Zoom handled by coordinate logic now
            />

            {/* Stats Panel (appears on left) */}
            <AnimatePresence>
                {viewMode === 'details' && companyData && (
                    <CompanyStats data={companyData} />
                )}
            </AnimatePresence>

            {/* Health Trends Panel (appears on right) */}
            <AnimatePresence>
                {viewMode === 'details' && (
                    <HealthTrends isVisible={true} data={companyData} />
                )}
            </AnimatePresence>

            {/* Main Content Overlay */}
            {/* ... rest of the component ... */}
            <div className="relative z-30 w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-8 md:gap-10">

                <AnimatePresence mode="wait">
                    {viewMode === 'landing' ? (
                        <motion.div
                            key="landing-content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6 w-full flex flex-col items-center"
                        >
                            {/* Headline Group */}
                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                >
                                    <h1 className="text-7xl md:text-9xl font-bold tracking-tight text-white leading-tight">
                                        Over <span className="text-gradient"><AnimatedCounter end={1.4} /></span>
                                    </h1>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                    className="text-xl md:text-2xl text-white/80 font-medium max-w-3xl mx-auto leading-relaxed"
                                >
                                    is spent annually in costs and lost productivity related to preventable illness, with heart disease, stroke, diabetes, obesity, chronic kidney disease and dental disease standing as the greatest contributors.
                                </motion.p>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                    className="text-lg md:text-xl text-offwhite/60 font-light max-w-2xl mx-auto"
                                >
                                    How much is the failure to prevent chronic disease costing your company?
                                </motion.p>
                            </div>

                            {/* Facts Row */}
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {factsData.slice(0, 3).map((fact, i) => (
                                    <FactChip key={fact.id} label={fact.text} delay={0.6 + (i * 0.1)} />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details-spacer"
                            className="h-[20vh]" // Spacer to push search bar down slightly or keep layout balanced
                        />
                    )}
                </AnimatePresence>

                {/* Search Section - Persists but might move position */}
                <motion.div
                    layout
                    className="w-full mt-4 z-50"
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <AnimatePresence>
                        {viewMode === 'landing' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-3 text-sm font-medium text-offwhite/50 tracking-wider uppercase"
                            >
                                Calculate for your company
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <CompanySearch onSearch={handleSearch} />

                    {viewMode === 'details' && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => {
                                setViewMode('landing');
                                setCompanyData(null); // Explicitly clear data to trigger map reset
                            }}
                            className="mt-4 text-white/50 hover:text-white text-sm underline underline-offset-4"
                        >
                            Back to global view
                        </motion.button>
                    )}
                </motion.div>

            </div>
        </section>
    );
}

