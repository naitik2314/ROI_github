"use client";

import { useState, useRef } from "react";
import { Search, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ModernLoader from "./ModernLoader";

interface CompanySearchProps {
    onSearch: (query: string) => Promise<void>;
    examples?: string[];
}

export default function CompanySearch({ onSearch, examples = [] }: CompanySearchProps) {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (term?: string) => {
        const target = term || query;
        if (!target || isLoading) return;

        setIsLoading(true);
        setIsFocused(false);
        setQuery(term || query);
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

    const showExamples = isFocused && !isLoading && examples.length > 0 && query.length === 0;

    return (
        <div className="relative w-full max-w-lg mx-auto z-50">
            {/* Glow effect behind input */}
            <div
                className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: "linear-gradient(135deg, rgba(110,231,249,0.2), rgba(167,139,250,0.2))",
                    filter: "blur(8px)",
                    opacity: isFocused ? 1 : 0,
                }}
                aria-hidden="true"
            />

            <div className="relative group">
                {/* Search Icon / Loader */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-white/30 group-focus-within:text-accent-start transition-colors duration-300 z-10">
                    {isLoading ? (
                        <div className="scale-75"><ModernLoader /></div>
                    ) : (
                        <Search size={18} />
                    )}
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    id="company-search-input"
                    type="text"
                    className="w-full pl-11 pr-36 py-4 text-base glass-input rounded-2xl text-white placeholder-white/25 outline-none transition-all duration-300 focus:ring-1 focus:ring-accent-start/40 focus:bg-white/8 disabled:opacity-60"
                    placeholder="Search any company (e.g. Google)…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={onKeyDown}
                    disabled={isLoading}
                    autoComplete="off"
                    aria-label="Search company"
                />

                {/* CTA Button */}
                <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                        id="company-search-button"
                        onClick={() => handleSearch()}
                        disabled={isLoading || !query.trim()}
                        className="relative flex items-center gap-2 bg-gradient-to-r from-accent-start to-accent-end text-ink font-semibold text-sm px-5 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 overflow-hidden"
                        aria-label="Calculate ROI"
                    >
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.span
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <Loader2 size={14} className="animate-spin" />
                                    Analyzing…
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <Sparkles size={13} />
                                    Calculate
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Example suggestions dropdown */}
            <AnimatePresence>
                {showExamples && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 w-full glass-card rounded-xl border border-white/10 bg-ink/80 backdrop-blur-xl overflow-hidden z-50"
                    >
                        <div className="px-3 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest border-b border-white/5">
                            Try an example
                        </div>
                        {examples.map((company) => (
                            <button
                                key={company}
                                onMouseDown={() => handleSearch(company)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors group"
                            >
                                <Search size={13} className="text-white/20 group-hover:text-accent-start transition-colors" />
                                {company}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
