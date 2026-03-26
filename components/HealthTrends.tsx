"use client";

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useState } from 'react';
import { Maximize2, Minimize2, DollarSign, Activity, BarChart2, Users } from 'lucide-react';
import CommuterTable from './CommuterTable';
import SocialMediaFeed from './SocialMediaFeed';
import GoogleTrends from './GoogleTrends';
import RoiPanel from './RoiPanel';

const TABS = [
    { id: 'roi', label: 'ROI', icon: DollarSign },
    { id: 'biometrics', label: 'Health', icon: Activity },
    { id: 'insights', label: 'Insights', icon: BarChart2 },
] as const;

type TabId = typeof TABS[number]['id'];

const COLORS = {
    bp: '#FF2E7E',
    cholesterol: '#4DEEEA',
};

interface HealthTrendsProps {
    isVisible: boolean;
    data?: any;
}

export default function HealthTrends({ isVisible, data }: HealthTrendsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('roi');
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const commuters = data?.commuters || [];
    const socialPosts = data?.socialPosts || [];
    const trends = data?.trendingTopics || [];
    const roi = data?.roiAnalysis;

    const panelVariants: Variants = {
        hidden: { opacity: 0, x: 60 },
        visible: { opacity: 1, x: 0 },
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Expanded backdrop */}
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
                            onClick={() => setIsExpanded(false)}
                        />
                    )}

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={panelVariants}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={isExpanded
                            ? "fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 pointer-events-none"
                            : "fixed right-4 md:right-6 top-[4%] z-40 w-[90%] md:w-[420px] pointer-events-none hidden md:block max-h-[92vh] overflow-y-auto no-scrollbar"
                        }
                    >
                        <div
                            className={`rounded-2xl border border-white/10 shadow-panel backdrop-blur-xl pointer-events-auto transition-all duration-500 overflow-hidden ${isExpanded ? 'w-full max-w-5xl h-[85vh]' : ''}`}
                            style={{ background: "rgba(8,12,23,0.80)" }}
                        >
                            {/* Header gradient strip */}
                            <div className="h-px w-full bg-gradient-to-r from-accent-start/50 via-accent-mid/50 to-accent-end/50" />

                            {/* Header */}
                            <div className="flex justify-between items-center px-5 pt-4 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <span className="w-1 h-4 bg-gradient-to-b from-accent-start to-accent-end rounded-full" />
                                        Health Risk Dashboard
                                    </h3>
                                    {data?.name && (
                                        <p className="text-[10px] text-white/30 ml-3 mt-0.5 truncate max-w-[200px]">{data.name}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                                    aria-label={isExpanded ? 'Minimize panel' : 'Expand panel'}
                                >
                                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex gap-1 px-4 pb-3 border-b border-white/5">
                                {TABS.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeTab === id
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon size={11} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className={`${isExpanded ? 'grid md:grid-cols-2 gap-6 p-6 h-[calc(100%-7rem)] overflow-y-auto custom-scrollbar' : 'p-4 space-y-4 overflow-y-auto custom-scrollbar max-h-[calc(92vh-8rem)]'}`}>
                                <AnimatePresence mode="wait">
                                    {/* ROI Tab */}
                                    {activeTab === 'roi' && roi && (
                                        <motion.div
                                            key="roi"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className={isExpanded ? "col-span-2" : ""}
                                        >
                                            <RoiPanel data={roi} variant={isExpanded ? 'full' : 'compact'} />
                                        </motion.div>
                                    )}
                                    {activeTab === 'roi' && !roi && (
                                        <motion.div
                                            key="roi-empty"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-12 text-white/20 text-sm"
                                        >
                                            ROI data unavailable
                                        </motion.div>
                                    )}

                                    {/* Biometrics Tab */}
                                    {activeTab === 'biometrics' && (
                                        <motion.div
                                            key="bio"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="space-y-5"
                                        >
                                            <div>
                                                <div className="flex justify-between text-xs text-white/50 mb-2">
                                                    <span className="font-medium">Avg Blood Pressure Trend</span>
                                                    <span style={{ color: COLORS.bp }} className="font-bold">138/89 ↑</span>
                                                </div>
                                                <div className="h-20 flex items-end justify-between gap-1 border-b border-white/10 pb-1">
                                                    {[40, 55, 45, 60, 50, 75, 65, 85, 75, 95].map((h, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${h}%` }}
                                                            transition={{ duration: 1.5, delay: i * 0.1, ease: "backOut" }}
                                                            className="w-full rounded-t cursor-pointer relative group"
                                                            style={{ backgroundColor: COLORS.bp, boxShadow: `0 0 8px ${COLORS.bp}30` }}
                                                            onMouseEnter={() => setHoveredBar(i)}
                                                            onMouseLeave={() => setHoveredBar(null)}
                                                        >
                                                            {hoveredBar === i && (
                                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none border border-white/10">
                                                                    {110 + Math.floor(h * 0.5)}/{70 + Math.floor(h * 0.3)}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between text-[9px] text-white/20 mt-1">
                                                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map(m => (
                                                        <span key={m}>{m}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs text-white/50 mb-2">
                                                    <span className="font-medium">Cholesterol Risk Index</span>
                                                    <span style={{ color: COLORS.cholesterol }} className="font-bold">+24%</span>
                                                </div>
                                                <div className="relative h-16 border-l border-b border-white/10 overflow-hidden rounded-br">
                                                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                                                        <motion.path
                                                            d="M0,64 C20,56 40,60 60,48 C80,38 100,42 120,30 C140,22 160,26 180,14 C200,6 220,10 240,2"
                                                            fill="none"
                                                            stroke={COLORS.cholesterol}
                                                            strokeWidth="2"
                                                            initial={{ pathLength: 0 }}
                                                            animate={{ pathLength: 1 }}
                                                            transition={{ duration: 2.5, ease: "easeInOut" }}
                                                            style={{ filter: `drop-shadow(0 0 4px ${COLORS.cholesterol})` }}
                                                        />
                                                        <motion.path
                                                            d="M0,64 C20,56 40,60 60,48 C80,38 100,42 120,30 C140,22 160,26 180,14 C200,6 220,10 240,2 L240,64 L0,64 Z"
                                                            fill={COLORS.cholesterol}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 0.08 }}
                                                            transition={{ delay: 0.5, duration: 1.5 }}
                                                        />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Risk summary pills */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { label: "Obesity Rate", val: "31%", color: "text-red-400 bg-red-500/10" },
                                                    { label: "Diabetes Risk", val: "18%", color: "text-yellow-400 bg-yellow-500/10" },
                                                    { label: "Active Users", val: "43%", color: "text-green-400 bg-green-500/10" },
                                                ].map(pill => (
                                                    <div key={pill.label} className={`rounded-xl px-3 py-2.5 ${pill.color} text-center border border-white/5`}>
                                                        <div className="text-lg font-bold">{pill.val}</div>
                                                        <div className="text-[9px] opacity-70 mt-0.5">{pill.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Insights Tab */}
                                    {activeTab === 'insights' && (
                                        <motion.div
                                            key="insights"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="space-y-4"
                                        >
                                            {commuters.length > 0 && <CommuterTable data={commuters} />}
                                            {trends.length > 0 && <GoogleTrends data={trends} />}
                                            {socialPosts.length > 0 && <SocialMediaFeed posts={socialPosts} />}
                                            {commuters.length === 0 && trends.length === 0 && (
                                                <div className="text-center py-12 text-white/20 text-sm">
                                                    No regional insights available
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
