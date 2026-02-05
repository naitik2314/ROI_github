import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import CommuterTable from './CommuterTable';
import SocialMediaFeed from './SocialMediaFeed';
import GoogleTrends from './GoogleTrends';

// Neon colors - distinct from the map's blue/white
const COLORS = {
    bp: '#FF2E7E', // Neon Pink/Red
    cholesterol: '#4DEEEA', // Neon Cyan
};

interface HealthTrendsProps {
    isVisible: boolean;
    data?: any;
}

export default function HealthTrends({ isVisible, data }: HealthTrendsProps) {
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Mock data fallback if API doesn't return
    const commuters = data?.commuters || [
        { county: "Loading...", count: 0, percent: 0 }
    ];
    const socialPosts = data?.socialPosts || [];
    const trends = data?.trendingTopics || [];

    // Animation variants
    const panelVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
        expanded: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.5, ease: "easeInOut" }
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop for Expanded Mode */}
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
                        animate={isExpanded ? "expanded" : "visible"}
                        exit="hidden"
                        variants={panelVariants}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={isExpanded
                            ? "fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 pointer-events-none"
                            : "fixed right-4 md:right-8 top-[5%] z-40 w-[90%] md:w-[450px] pointer-events-none hidden md:block max-h-[90vh] overflow-y-auto no-scrollbar"
                        }
                    >
                        <div className={`glass-card rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl bg-ink/40 pointer-events-auto transition-all duration-500 ${isExpanded ? 'w-full max-w-6xl h-[80vh] overflow-y-auto p-8 grid md:grid-cols-2 gap-8' : 'p-5'}`}>

                            {/* Header */}
                            <div className={`${isExpanded ? 'col-span-2' : ''} flex justify-between items-start mb-6`}>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <span className="w-1.5 h-8 bg-accent-start rounded-full" />
                                    <div>
                                        Health Risk Trends
                                        {isExpanded && <span className="block text-sm font-normal text-white/50">Comprehensive County Analysis</span>}
                                    </div>
                                </h3>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                                >
                                    {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                </button>
                            </div>

                            {/* Charts Section */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-2">Biometrics</h4>
                                {/* Animated Bar Chart - Avg BP */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>Rising Avg Blood Pressure</span>
                                        <span style={{ color: COLORS.bp }} className="font-bold">138/89</span>
                                    </div>
                                    <div className="h-24 flex items-end justify-between gap-1 border-b border-white/10 pb-1 relative">
                                        {[40, 55, 45, 60, 50, 75, 65, 85, 75, 95].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ duration: 2, delay: i * 0.15, ease: "backOut" }}
                                                className="w-full rounded-t-sm opacity-80 cursor-pointer relative group"
                                                style={{
                                                    backgroundColor: COLORS.bp,
                                                    boxShadow: `0 0 10px ${COLORS.bp}40`
                                                }}
                                                onMouseEnter={() => setHoveredBar(i)}
                                                onMouseLeave={() => setHoveredBar(null)}
                                            >
                                                {/* Tooltip */}
                                                {hoveredBar === i && (
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                                        {110 + Math.floor(h * 0.5)}/{70 + Math.floor(h * 0.3)}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Animated Line Chart - Risk Factor */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>Cholesterol Risk Index</span>
                                        <span style={{ color: COLORS.cholesterol }} className="font-bold">+24%</span>
                                    </div>
                                    <div className="relative h-20 border-l border-b border-white/10 overflow-hidden">
                                        <svg className="absolute inset-0 w-full h-full overflow-visible">
                                            <motion.path
                                                d="M0,80 C20,70 40,75 60,60 C80,50 100,55 120,40 C140,30 160,35 180,20 C200,10 220,15 240,5"
                                                fill="none"
                                                stroke={COLORS.cholesterol}
                                                strokeWidth="2"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 3, ease: "easeInOut" }}
                                                style={{ filter: `drop-shadow(0 0 4px ${COLORS.cholesterol})` }}
                                            />
                                            <motion.path
                                                d="M0,80 C20,70 40,75 60,60 C80,50 100,55 120,40 C140,30 160,35 180,20 C200,10 220,15 240,5 L240,100 L0,100 Z"
                                                fill={COLORS.cholesterol}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.1 }}
                                                transition={{ delay: 0.5, duration: 2 }}
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Data Feeds Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-2">Regional Insights</h4>

                                {/* Commuter Data */}
                                {commuters.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                    >
                                        <CommuterTable data={commuters} />
                                    </motion.div>
                                )}

                                {/* Google Trends */}
                                {trends.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.65, duration: 0.8 }}
                                    >
                                        <GoogleTrends data={trends} />
                                    </motion.div>
                                )}

                                {/* Social Media Feed */}
                                {socialPosts.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8, duration: 0.8 }}
                                    >
                                        <SocialMediaFeed posts={socialPosts} />
                                    </motion.div>
                                )}
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
