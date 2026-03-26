"use client";

import { motion } from "framer-motion";
import { CircleDot, Pill, Heart, Activity } from "lucide-react";

interface FactChipProps {
    label: string;
    delay: number;
    icon?: "dot" | "pill" | "heart" | "activity";
}

const ICONS = {
    dot: CircleDot,
    pill: Pill,
    heart: Heart,
    activity: Activity,
};

const CHIP_VARIANTS = [
    "border-accent-start/20 text-accent-start/80",
    "border-accent-end/20 text-accent-end/80",
    "border-white/10 text-white/50",
];

export default function FactChip({ label, delay }: FactChipProps) {
    const variant = CHIP_VARIANTS[delay % CHIP_VARIANTS.length > 0 ? Math.floor((delay * 10) % 3) : 0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium tracking-wide backdrop-blur-sm bg-white/[0.03] cursor-default select-none ${variant}`}
        >
            <span className="w-1 h-1 rounded-full bg-current opacity-60 shrink-0" />
            {label}
        </motion.div>
    );
}
