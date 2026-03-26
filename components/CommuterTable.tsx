"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface CommuterData {
    county: string;
    count: number;
    percent: number;
    riskLevel?: 'High' | 'Medium' | 'Low';
    topHealthConcern?: string;
}

const RiskIcon = ({ level }: { level?: string }) => {
    if (level === 'High') return <AlertTriangle size={11} className="text-red-400" />;
    if (level === 'Medium') return <AlertCircle size={11} className="text-yellow-400" />;
    return <CheckCircle size={11} className="text-green-400" />;
};

const riskColors: Record<string, string> = {
    High: 'text-red-400 bg-red-500/10 border-red-500/20',
    Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    Low: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function CommuterTable({ data }: { data: CommuterData[] }) {
    const maxCount = Math.max(...data.map(d => d.count));

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h4 className="text-xs font-bold text-white/80 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    Commuter Flow Analysis
                </h4>
                <span className="text-[10px] text-white/20">{data.length} counties</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
                {data.map((row, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="px-4 py-3 hover:bg-white/[0.03] transition-colors group"
                    >
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-white truncate">{row.county}</div>
                                {row.topHealthConcern && (
                                    <div className="text-[10px] text-white/30 mt-0.5">{row.topHealthConcern}</div>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-white/80 tabular-nums">{row.count.toLocaleString()}</div>
                                <div className="text-[10px] text-accent-end">{row.percent}%</div>
                            </div>
                            {row.riskLevel && (
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${riskColors[row.riskLevel]}`}>
                                    <RiskIcon level={row.riskLevel} />
                                    {row.riskLevel}
                                </span>
                            )}
                        </div>

                        {/* Percentage bar */}
                        <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-accent-start/70 to-accent-end/70"
                                initial={{ width: 0 }}
                                animate={{ width: `${row.percent}%` }}
                                transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
