"use client";

import { useState, useRef } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface CompanySearchProps {
    onSearch: (query: string) => Promise<void>;
}

export default function CompanySearch({ onSearch }: CompanySearchProps) {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (term?: string) => {
        const target = term || query;
        if (!target) return;

        setIsLoading(true);
        setIsFocused(false);
        try {
            await onSearch(target);
        } finally {
            setIsLoading(false);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        } else if (e.key === "Escape") {
            setIsFocused(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="relative w-full max-w-md mx-auto z-50">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-white/40 group-focus-within:text-accent-start transition-colors">
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full pl-12 pr-32 py-4 text-lg glass-input rounded-xl text-white placeholder-white/30 outline-none transition-all focus:ring-2 focus:ring-accent-start/50"
                    placeholder="Search company (e.g. Google)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={onKeyDown}
                    disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                        onClick={() => handleSearch()}
                        disabled={isLoading || !query}
                        className="flex items-center gap-2 bg-gradient-to-r from-accent-start to-accent-end text-ink font-semibold px-4 py-2 rounded-lg hover:brightness-110 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Searching..." : "Calculate"}
                    </button>
                </div>
            </div>
        </div>
    );
}

