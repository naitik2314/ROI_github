"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { DollarSign, TrendingUp, Users, ShieldCheck } from "lucide-react";

interface RoiAnalysisData {
    estimatedAnnualCost: string;
    costPerEmployee: string;
    potentialSavings: string;
    roi: string;
    diseaseBreakdown: {
        name: string;
        cost: number;
        formattedCost: string;
    }[];
}

const DISEASE_COLORS = [
    { from: '#FF4D6D', to: '#C9184A' },
    { from: '#FFD166', to: '#F4A261' },
    { from: '#4CC9F0', to: '#4361EE' },
    { from: '#A78BFA', to: '#7C3AED' },
    { from: '#06D6A0', to: '#0891B2' },
];

const StatCard = ({ title, value, subtext, icon: Icon, gradient, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="relative rounded-xl p-4 overflow-hidden border border-white/5 bg-white/[0.03] group hover:border-white/10 transition-all duration-300"
    >
        <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity rounded-bl-full`}
            style={{ background: gradient }} />
        <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">{title}</div>
        <div className="text-xl font-bold text-white tracking-tight mb-0.5">{value}</div>
        <div className="text-[10px] text-white/30">{subtext}</div>
    </motion.div>
);

export default function RoiPanel({ data, variant = 'full' }: { data: RoiAnalysisData; variant?: 'full' | 'compact' }) {
    if (!data) return null;

    const maxCost = Math.max(...data.diseaseBreakdown.map(d => d.cost));
    const isCompact = variant === 'compact';

    return (
        <div className="space-y-4">
            {/* Top Metrics Grid */}
            <div className={`grid ${isCompact ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-3'}`}>
                <StatCard
                    title={isCompact ? "Est. Cost" : "Est. Annual Cost"}
                    value={data.estimatedAnnualCost}
                    subtext="Health-related absenteeism"
                    icon={DollarSign}
                    gradient="linear-gradient(135deg, #FF4D6D, #C9184A)"
                    delay={0}
                />
                <StatCard
                    title={isCompact ? "Per Employee" : "Cost Per Employee"}
                    value={data.costPerEmployee}
                    subtext="Average annual impact"
                    icon={Users}
                    gradient="linear-gradient(135deg, #FFD166, #F4A261)"
                    delay={0.08}
                />
                <StatCard
                    title={isCompact ? "Savings" : "Potential Savings"}
                    value={data.potentialSavings}
                    subtext="With preventative screenings"
                    icon={ShieldCheck}
                    gradient="linear-gradient(135deg, #06D6A0, #0891B2)"
                    delay={0.16}
                />
                <StatCard
                    title="Projected ROI"
                    value={data.roi}
                    subtext="Net financial return"
                    icon={TrendingUp}
                    gradient="linear-gradient(135deg, #A78BFA, #7C3AED)"
                    delay={0.24}
                />
            </div>

            {/* Disease Impact Chart */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
                <h4 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">
                    Disease Cost Breakdown
                </h4>

                {/* Horizontal bar chart */}
                <div className="space-y-3">
                    {data.diseaseBreakdown.map((item, i) => {
                        const widthPercent = (item.cost / maxCost) * 100;
                        const colors = DISEASE_COLORS[i % DISEASE_COLORS.length];
                        return (
                            <div key={i} className="group">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-white/60 font-medium">{item.name}</span>
                                    <span className="text-xs font-bold text-white/80 tabular-nums">{item.formattedCost}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: `linear-gradient(90deg, ${colors.from}, ${colors.to})` }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${widthPercent}%` }}
                                        transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
