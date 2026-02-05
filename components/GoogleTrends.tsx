"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Search } from "lucide-react";

interface TrendData {
    term: string;
    volume: string;
    growth: string;
}

export default function GoogleTrends({ data }: { data: TrendData[] }) {
    return (
        <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/5 mt-4">
            <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="p-1 bg-white/10 rounded">
                    <Search size={12} className="text-accent-start" />
                </span>
                Trending Health Searches
            </h4>

            <div className="space-y-3">
                {data.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-white/20 font-mono text-xs">0{i + 1}</span>
                            <span className="text-sm text-gray-200 group-hover:text-white transition-colors">{item.term}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40">{item.volume}</span>
                            <span className="text-xs font-bold text-green-400 flex items-center gap-0.5">
                                {item.growth}
                                <TrendingUp size={10} />
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
