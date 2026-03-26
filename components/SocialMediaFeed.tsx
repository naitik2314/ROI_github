"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Wind, Smile, Droplets, MessageCircle, Heart, ChevronLeft, ChevronRight } from "lucide-react";

interface SocialPost {
    id: number;
    user: string;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    topic: 'air' | 'happiness' | 'water' | 'general';
}

const TOPIC_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    air: { icon: Wind, color: 'text-slate-300', bg: 'bg-slate-500/10' },
    happiness: { icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    water: { icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    general: { icon: MessageCircle, color: 'text-white/40', bg: 'bg-white/5' },
};

const SENTIMENT_STYLE = {
    positive: 'text-emerald-400 bg-emerald-500/10',
    negative: 'text-red-400 bg-red-500/10',
    neutral: 'text-white/30 bg-white/5',
};

export default function SocialMediaFeed({ posts }: { posts: SocialPost[] }) {
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused || posts.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % posts.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [posts.length, isPaused]);

    const post = posts[index];
    const topicCfg = TOPIC_CONFIG[post?.topic] || TOPIC_CONFIG.general;
    const TopicIcon = topicCfg.icon;

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h4 className="text-xs font-bold text-white/80 flex items-center gap-2">
                    <span className="relative">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 block" />
                        <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                    </span>
                    Local Pulse
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/20 tracking-widest uppercase bg-white/5 px-1.5 py-0.5 rounded">
                        LIVE
                    </span>
                    {/* Manual navigation */}
                    <div className="flex gap-0.5">
                        <button
                            onClick={() => setIndex((prev) => (prev - 1 + posts.length) % posts.length)}
                            className="p-0.5 hover:bg-white/10 rounded text-white/20 hover:text-white/60 transition-colors"
                            aria-label="Previous post"
                        >
                            <ChevronLeft size={12} />
                        </button>
                        <button
                            onClick={() => setIndex((prev) => (prev + 1) % posts.length)}
                            className="p-0.5 hover:bg-white/10 rounded text-white/20 hover:text-white/60 transition-colors"
                            aria-label="Next post"
                        >
                            <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            <div
                className="p-4"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="h-[88px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.28 }}
                            className="absolute inset-0"
                        >
                            <div className="flex items-start gap-3 h-full">
                                <div className={`mt-0.5 p-1.5 rounded-lg ${topicCfg.bg} shrink-0`}>
                                    <TopicIcon size={13} className={topicCfg.color} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-accent-start">{post?.user}</span>
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${SENTIMENT_STYLE[post?.sentiment || 'neutral']}`}>
                                            {post?.sentiment}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed line-clamp-3">
                                        "{post?.content}"
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-1 mt-3">
                    {posts.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-accent-start/60' : 'w-1.5 bg-white/10 hover:bg-white/20'}`}
                            aria-label={`Post ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
