"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Search, Flame } from "lucide-react";

interface TrendData {
    term: string;
    volume: string;
    growth: string;
}

function parseGrowth(g: string): number {
    return parseInt(g.replace(/[^-\d]/g, '')) || 0;
}

export default function GoogleTrends({ data }: { data: TrendData[] }) {
    const maxGrowth = Math.max(...data.map(d => Math.abs(parseGrowth(d.growth))));

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <div className="p-1 bg-white/5 rounded-md">
                    <Search size={11} className="text-accent-start" />
                </div>
                <h4 className="text-xs font-bold text-white/80">Trending Health Searches</h4>
            </div>

            <div className="divide-y divide-white/[0.04]">
                {data.map((item, i) => {
                    const growth = parseGrowth(item.growth);
                    const isPositive = growth >= 0;
                    const barWidth = (Math.abs(growth) / maxGrowth) * 100;

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="px-4 py-3 hover:bg-white/[0.03] transition-colors group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-white/15 font-mono text-xs shrink-0">0{i + 1}</span>
                                    <span className="text-sm text-white/70 group-hover:text-white transition-colors truncate">{item.term}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] text-white/25 hidden sm:block">{item.volume}</span>
                                    <span className={`flex items-center gap-0.5 text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {item.growth}
                                    </span>
                                    {growth > 100 && <Flame size={11} className="text-orange-400" />}
                                </div>
                            </div>

                            {/* Growth bar */}
                            <div className="h-0.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${isPositive ? 'bg-emerald-500/60' : 'bg-red-500/60'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barWidth}%` }}
                                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
