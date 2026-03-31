"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Users, Building2, MapPin, TrendingUp, ChevronRight } from "lucide-react";

interface CompanyStatsProps {
    data: {
        name: string;
        location: {
            city: string;
            county?: string;
            state: string;
            coordinates?: { lat: number; lng: number };
        };
        stats: {
            employeeCount: string;
            revenue?: string;
            industry?: string;
        };
        summary: string;
        roiAnalysis?: {
            estimatedAnnualCost: string;
            roi: string;
        };
    };
}

function StatRow({ icon: Icon, color, label, value, sub, delay = 0 }: {
    icon: any; color: string; label: string; value: string; sub?: string; delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.03] group"
        >
            <div className={`mt-0.5 p-2 rounded-xl ${color} shrink-0 shadow-[0_0_15px_currentColor] opacity-80 group-hover:opacity-100 transition-opacity`}>
                <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold mb-1 font-outfit">{label}</div>
                <div className="text-white/90 font-medium text-[15px] truncate font-outfit tracking-wide">{value}</div>
                {sub && <div className="text-white/30 text-[11px] mt-1 italic">{sub}</div>}
            </div>
        </motion.div>
    );
}

export default function CompanyStats({ data }: CompanyStatsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -40, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -40, filter: "blur(10px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-4 right-4 md:left-8 md:right-auto top-[20%] md:top-1/2 md:-translate-y-1/2 z-40 w-auto md:w-[340px] mx-auto max-w-sm"
        >
            <div className="rounded-[2rem] border border-white/[0.08] backdrop-blur-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative bg-[#080C17]/60">
                
                {/* Dynamic glowing border effect */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#6EE7F9]/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#A78BFA]/30 to-transparent" />

                <div className="p-6">
                    {/* Header glass badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 mb-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6EE7F9] shadow-[0_0_8px_#6EE7F9] animate-pulse" />
                        <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-outfit font-semibold">Live Intel</span>
                    </div>

                    {/* Company Name & Summary */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 leading-tight mb-3 font-outfit">{data.name}</h2>
                        <p className="text-white/40 text-sm leading-relaxed line-clamp-3 font-light">{data.summary}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-3">
                        <StatRow
                            icon={MapPin}
                            color="bg-[#6EE7F9]/10 text-[#6EE7F9]"
                            label="Headquarters"
                            value={`${data.location.city}, ${data.location.state}`}
                            sub={data.location.county}
                            delay={0.1}
                        />

                        <StatRow
                            icon={Users}
                            color="bg-[#A78BFA]/10 text-[#A78BFA]"
                            label="US Employees"
                            value={data.stats.employeeCount}
                            delay={0.2}
                        />

                        {data.stats.industry && (
                            <StatRow
                                icon={Building2}
                                color="bg-white/5 text-white/70"
                                label="Industry"
                                value={data.stats.industry}
                                delay={0.3}
                            />
                        )}
                    </div>

                    {/* Expand hint */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between group cursor-pointer">
                        <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] group-hover:text-[#6EE7F9] transition-colors font-outfit">Full analysis detailed</span>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-[#6EE7F9] group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
