"use client";

import { motion } from "framer-motion";
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

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="glass-card p-4 rounded-xl border border-white/10 bg-white/5 relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity ${colorClass}`}>
            <Icon size={40} />
        </div>
        <h4 className="text-sm text-white/40 mb-1 font-medium">{title}</h4>
        <div className="text-2xl font-bold text-white mb-2 tracking-tight">{value}</div>
        <div className="text-[10px] text-white/50">{subtext}</div>
    </motion.div>
);

export default function RoiPanel({ data, variant = 'full' }: { data: RoiAnalysisData, variant?: 'full' | 'compact' }) {
    if (!data) return null;

    // Find max cost for bar scaling
    const maxCost = Math.max(...data.diseaseBreakdown.map(d => d.cost));
    const isCompact = variant === 'compact';

    return (
        <div className="space-y-6">
            {/* Top Metrics Grid */}
            <div className={`grid ${isCompact ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
                <StatCard
                    title={isCompact ? "Est. Cost" : "Est. Annual Cost"}
                    value={data.estimatedAnnualCost}
                    subtext={isCompact ? "Absenteeism" : "Health-related absenteeism"}
                    icon={DollarSign}
                    colorClass="text-red-400"
                    delay={0}
                />
                <StatCard
                    title={isCompact ? "Per Employee" : "Cost Per Employee"}
                    value={data.costPerEmployee}
                    subtext={isCompact ? "Annual Avg" : "Average annual impact"}
                    icon={Users}
                    colorClass="text-yellow-400"
                    delay={0.1}
                />
                <StatCard
                    title={isCompact ? "Savings" : "Potential Savings"}
                    value={data.potentialSavings}
                    subtext={isCompact ? "With Prevention" : "With preventative screenings"}
                    icon={ShieldCheck}
                    colorClass="text-green-400"
                    delay={0.2}
                />
                <StatCard
                    title={isCompact ? "ROI" : "Projected ROI"}
                    value={data.roi}
                    subtext={isCompact ? "Net Return" : "Net financial return"}
                    icon={TrendingUp}
                    colorClass="text-blue-400"
                    delay={0.3}
                />
            </div>

            {/* Disease Impact Chart */}
            <div className={`glass-card rounded-xl border border-white/10 bg-white/5 ${isCompact ? 'p-4' : 'p-6'}`}>
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-accent-start rounded-full" />
                    {isCompact ? "Disease Impact" : "Disease Impact Breakdown"}
                </h4>

                <div className={`${isCompact ? 'h-32' : 'h-48'} flex items-end justify-between gap-2`}>
                    {data.diseaseBreakdown.map((item, i) => {
                        const heightPercent = (item.cost / maxCost) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                {!isCompact && (
                                    <div className="text-xs text-white/0 group-hover:text-white/100 transition-opacity font-bold mb-1 opacity-0 -translate-y-2 group-hover:translate-y-0 duration-300">
                                        {item.formattedCost}
                                    </div>
                                )}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercent}%` }}
                                    transition={{ duration: 1, delay: 0.4 + (i * 0.1), ease: "backOut" }}
                                    className="w-full bg-gradient-to-t from-blue-500/20 to-blue-400/60 rounded-t-sm relative hover:brightness-125 transition-all cursor-pointer"
                                >
                                    <div className="absolute inset-x-0 top-0 h-[1px] bg-blue-400/50" />
                                </motion.div>
                                <div className={`text-white/40 text-center leading-tight truncate w-full ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>{item.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
