"use client";

import { motion } from "framer-motion";
import { Users, Building2, MapPin } from "lucide-react";

interface CompanyStatsProps {
    data: {
        name: string;
        location: {
            city: string;
            county?: string;
            state: string;
            coordinates?: {
                lat: number;
                lng: number;
            };
        };
        stats: {
            employeeCount: string;
            revenue?: string;
            industry?: string;
        };
        summary: string;
    };
}

export default function CompanyStats({ data }: CompanyStatsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed left-4 right-4 md:left-8 md:right-auto top-1/2 -translate-y-1/2 z-40 w-auto md:w-96 mx-auto max-w-md"
        >
            <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">{data.name}</h2>
                    <p className="text-white/60 text-sm leading-relaxed">{data.summary}</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 data-row">
                        <div className="p-2 bg-accent-start/20 rounded-lg text-accent-start">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                                Headquarters
                            </div>
                            <div className="text-white font-medium">
                                {data.location.city}, {data.location.state}
                            </div>
                            {data.location.county && (
                                <div className="text-white/60 text-sm">
                                    {data.location.county}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 data-row">
                        <div className="p-2 bg-accent-end/20 rounded-lg text-accent-end">
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                                US Employees
                            </div>
                            <div className="text-white font-medium text-lg">
                                {data.stats.employeeCount}
                            </div>
                        </div>
                    </div>

                    {data.stats.industry && (
                        <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 data-row">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                                    Industry
                                </div>
                                <div className="text-white font-medium">
                                    {data.stats.industry}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
