"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MessageCircle, ThumbsUp, Wind, Smile, Droplets } from "lucide-react";

interface SocialPost {
    id: number;
    user: string;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    topic: 'air' | 'happiness' | 'water' | 'general';
}

const TopicIcon = ({ topic }: { topic: string }) => {
    switch (topic) {
        case 'air': return <Wind size={14} className="text-gray-400" />;
        case 'happiness': return <Smile size={14} className="text-yellow-400" />;
        case 'water': return <Droplets size={14} className="text-blue-400" />;
        default: return <MessageCircle size={14} className="text-white/40" />;
    }
};

export default function SocialMediaFeed({ posts }: { posts: SocialPost[] }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % posts.length);
        }, 4000); // Rotate every 4 seconds
        return () => clearInterval(timer);
    }, [posts.length]);

    return (
        <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/5 mt-4">
            <h4 className="text-white text-sm font-semibold mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Live Local Pulse
                </span>
                <span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">LIVE</span>
            </h4>

            <div className="h-24 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                        <div className="bg-ink/50 border border-white/5 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-accent-start">{posts[index].user}</span>
                                <TopicIcon topic={posts[index].topic} />
                            </div>
                            <p className="text-xs text-gray-300 leading-snug line-clamp-2">
                                "{posts[index].content}"
                            </p>
                            <div className="flex gap-3 mt-2 text-[10px] text-white/30">
                                <span className="flex items-center gap-1"><ThumbsUp size={10} /> 12</span>
                                <span className={`${posts[index].sentiment === 'negative' ? 'text-red-400' : 'text-green-400'}`}>
                                    {posts[index].sentiment}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex justify-center gap-1 mt-2">
                {posts.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-white/40' : 'w-1 bg-white/10'}`}
                    />
                ))}
            </div>
        </div>
    );
}
