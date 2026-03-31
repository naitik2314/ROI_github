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

function AnimatedMetric({ value }: { value: string }) {
    const defaultNum = 0;
    // Extract non-digits (prefix), digits/commas, and end strings (suffix)
    const match = value.match(/^([^0-9]*)([0-9,.]+)(.*)$/);
    const prefix = match ? match[1] : "";
    const numStr = match ? match[2] : "0";
    const suffix = match ? match[3] : "";
    
    // Safely parse
    let num = defaultNum;
    let isFloat = false;
    if (numStr) {
        const cleanNumber = numStr.replace(/,/g, '');
        num = parseFloat(cleanNumber);
        if (cleanNumber.includes('.')) isFloat = true;
    }

    const spring = useSpring(0, { duration: 2500, bounce: 0 });
    const display = useTransform(spring, (current) => {
        return prefix + current.toLocaleString('en-US', {
            minimumFractionDigits: isFloat ? 1 : 0,
            maximumFractionDigits: isFloat ? 2 : 0
        }) + suffix;
    });

    useEffect(() => {
        if (!isNaN(num)) {
            spring.set(num);
        }
    }, [spring, num]);

    if (isNaN(num)) {
        return <span>{value}</span>; // Fallback if cannot parse
    }

    return <motion.span>{display}</motion.span>;
}

const StatCard = ({ title, value, subtext, icon: Icon, gradient, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl p-5 md:p-6 overflow-hidden border border-white/[0.06] bg-[#0A0F1D]/40 backdrop-blur-2xl group hover:bg-[#0A0F1D]/70 transition-all duration-500 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
    >
        <div className="absolute -top-12 -right-12 w-32 h-32 opacity-[0.15] group-hover:opacity-30 blur-3xl transition-opacity duration-700 rounded-full"
            style={{ background: gradient }} />
            
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-[0.2em] font-bold font-outfit">{title}</div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/40 group-hover:text-white transition-colors duration-300">
                <Icon size={16} />
            </div>
        </div>
        <div className="text-3xl md:text-4xl font-bold text-white tracking-tighter mb-1.5 font-outfit drop-shadow-lg relative z-10">
            <AnimatedMetric value={value} />
        </div>
        <div className="text-[11px] md:text-xs text-white/30 italic font-light relative z-10">{subtext}</div>
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
                    delay={0.15}
                />
                <StatCard
                    title={isCompact ? "Savings" : "Potential Savings"}
                    value={data.potentialSavings}
                    subtext="With preventative screenings"
                    icon={ShieldCheck}
                    gradient="linear-gradient(135deg, #06D6A0, #0891B2)"
                    delay={0.3}
                />
                <StatCard
                    title="Projected ROI"
                    value={data.roi}
                    subtext="Net financial return"
                    icon={TrendingUp}
                    gradient="linear-gradient(135deg, #A78BFA, #7C3AED)"
                    delay={0.45}
                />
            </div>

            {/* Disease Impact Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl border border-white/[0.06] bg-[#0A0F1D]/40 backdrop-blur-2xl p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-1 bg-[#A78BFA] rounded-full opacity-60" />
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] font-outfit">
                        Disease Cost Breakdown
                    </h4>
                </div>

                {/* Horizontal bar chart */}
                <div className="space-y-4">
                    {data.diseaseBreakdown.map((item, i) => {
                        const widthPercent = (item.cost / maxCost) * 100;
                        const colors = DISEASE_COLORS[i % DISEASE_COLORS.length];
                        return (
                            <div key={i} className="group relative">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm text-white/70 font-medium font-outfit tracking-wide">{item.name}</span>
                                    <span className="text-sm font-bold text-white/90 tabular-nums font-outfit">
                                        <AnimatedMetric value={item.formattedCost} />
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full rounded-full relative"
                                        style={{ background: `linear-gradient(90deg, ${colors.from}, ${colors.to})` }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${widthPercent}%` }}
                                        transition={{ duration: 1.5, delay: 0.8 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 w-1/2 blur-sm" style={{ animation: "shimmer 3s infinite linear" }} />
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
