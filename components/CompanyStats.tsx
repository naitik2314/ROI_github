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

function StatRow({ icon: Icon, color, label, value, sub }: {
    icon: any; color: string; label: string; value: string; sub?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] data-row border border-white/5"
        >
            <div className={`mt-0.5 p-1.5 rounded-lg ${color} shrink-0`}>
                <Icon size={15} />
            </div>
            <div className="min-w-0">
                <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-0.5">{label}</div>
                <div className="text-white font-medium text-sm truncate">{value}</div>
                {sub && <div className="text-white/40 text-xs mt-0.5">{sub}</div>}
            </div>
        </motion.div>
    );
}

export default function CompanyStats({ data }: CompanyStatsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed left-4 right-4 md:left-6 md:right-auto top-1/2 -translate-y-1/2 z-40 w-auto md:w-80 mx-auto max-w-sm"
        >
            <div className="rounded-2xl border border-white/10 shadow-panel backdrop-blur-xl overflow-hidden" style={{ background: "rgba(8,12,23,0.75)" }}>

                {/* Header gradient strip */}
                <div className="h-1 w-full bg-gradient-to-r from-accent-start to-accent-end opacity-70" />

                <div className="p-5">
                    {/* Company Name & Summary */}
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-white leading-tight mb-1.5">{data.name}</h2>
                        <p className="text-white/50 text-xs leading-relaxed line-clamp-3">{data.summary}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-2">
                        <StatRow
                            icon={MapPin}
                            color="bg-accent-start/15 text-accent-start"
                            label="Headquarters"
                            value={`${data.location.city}, ${data.location.state}`}
                            sub={data.location.county}
                        />

                        <StatRow
                            icon={Users}
                            color="bg-accent-end/15 text-accent-end"
                            label="US Employees"
                            value={data.stats.employeeCount}
                        />

                        {data.stats.industry && (
                            <StatRow
                                icon={Building2}
                                color="bg-blue-500/15 text-blue-400"
                                label="Industry"
                                value={data.stats.industry}
                            />
                        )}

                        {data.roiAnalysis && (
                            <StatRow
                                icon={TrendingUp}
                                color="bg-emerald-500/15 text-emerald-400"
                                label="Est. Annual Health Cost"
                                value={data.roiAnalysis.estimatedAnnualCost}
                                sub={`${data.roiAnalysis.roi} ROI with prevention`}
                            />
                        )}
                    </div>

                    {/* Expand hint */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-white/20 uppercase tracking-widest">Full analysis →</span>
                        <ChevronRight size={12} className="text-white/20" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
