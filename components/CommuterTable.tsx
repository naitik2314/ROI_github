"use client";

import { motion } from "framer-motion";

interface CommuterData {
    county: string;
    count: number;
    percent: number;
}

export default function CommuterTable({ data }: { data: CommuterData[] }) {
    return (
        <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/5">
            <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Commuter Flow
            </h4>
            <div className="overflow-hidden rounded-lg">
                <table className="w-full text-xs text-left">
                    <thead className="text-white/40 uppercase bg-white/5">
                        <tr>
                            <th className="px-3 py-2 font-medium">Origin County</th>
                            <th className="px-3 py-2 font-medium text-right">Count</th>
                            <th className="px-3 py-2 font-medium text-right">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                        {data.map((row, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="hover:bg-white/5 transition-colors"
                            >
                                <td className="px-3 py-2 font-medium text-white">{row.county}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{row.count.toLocaleString()}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-accent-end">{row.percent}%</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
