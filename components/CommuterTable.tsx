"use client";

import { motion } from "framer-motion";

interface CommuterData {
    county: string;
    count: number;
    percent: number;
    riskLevel?: 'High' | 'Medium' | 'Low';
    topHealthConcern?: string;
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
                            <th className="px-3 py-2 font-medium">Origin</th>
                            <th className="px-3 py-2 font-medium text-right">Count</th>
                            <th className="px-3 py-2 font-medium text-center">Risk</th>
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
                                <td className="px-3 py-2 font-medium text-white">
                                    {row.county}
                                    {row.topHealthConcern && (
                                        <div className="text-[9px] text-white/30">{row.topHealthConcern}</div>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                    {row.count.toLocaleString()}
                                    <div className="text-[9px] text-accent-end">{row.percent}%</div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {row.riskLevel && (
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' :
                                            row.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                            {row.riskLevel}
                                        </span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
