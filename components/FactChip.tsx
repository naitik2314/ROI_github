"use client";

import { motion } from "framer-motion";

interface FactChipProps {
    label: string;
    delay: number;
}

export default function FactChip({ label, delay }: FactChipProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay,
                duration: 0.5,
                ease: "easeOut"
            }}
            className="inline-flex glass-card px-4 py-2 rounded-full"
        >
            <span className="text-sm font-medium text-offwhite/80">{label}</span>
        </motion.div>
    );
}
