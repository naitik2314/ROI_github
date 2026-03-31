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
        <div className="relative w-full max-w-2xl mx-auto z-50">
            {/* Animated Glow effect behind input */}
            <motion.div
                className="absolute -inset-[2px] rounded-[2rem] pointer-events-none bg-gradient-to-r from-[#6EE7F9] via-[#A78BFA] to-[#6EE7F9] blur-md z-0"
                initial={{ opacity: 0 }}
                animate={{
                    opacity: isFocused ? 0.6 : 0,
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                    opacity: { duration: 0.4 },
                    backgroundPosition: { duration: 8, repeat: Infinity, ease: "linear" }
                }}
                style={{ backgroundSize: "200% 200%" }}
                aria-hidden="true"
            />

            <div className="relative group z-10">
                {/* Search Icon / Loader */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none text-white/40 group-focus-within:text-[#6EE7F9] transition-colors duration-300 z-10">
                    {isLoading ? (
                        <div className="scale-75"><ModernLoader /></div>
                    ) : (
                        <Search size={22} />
                    )}
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    id="company-search-input"
                    type="text"
                    className="w-full pl-16 pr-44 py-5 text-lg lg:text-xl rounded-[2rem] text-white placeholder-white/30 outline-none transition-all duration-300 bg-[#0A0F1D]/80 backdrop-blur-2xl border border-white/10 hover:border-white/20 focus:border-[#6EE7F9]/50 focus:bg-[#0F1528] disabled:opacity-60 font-outfit shadow-2xl"
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
                <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                    <button
                        id="company-search-button"
                        onClick={() => handleSearch()}
                        disabled={isLoading || !query.trim()}
                        className="pointer-events-auto relative flex items-center justify-center gap-2 bg-white text-[#030614] font-bold text-sm md:text-base px-6 py-3 rounded-[1.5rem] hover:scale-[1.03] active:scale-95 transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] font-outfit tracking-wide min-w-[140px]"
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
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full mt-4 w-full bg-[#0A0F1D]/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 overflow-hidden z-50 shadow-2xl p-2"
                    >
                        <div className="px-5 py-3 text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] font-outfit">
                            Try an example
                        </div>
                        {examples.map((company) => (
                            <button
                                key={company}
                                onMouseDown={() => handleSearch(company)}
                                className="w-full flex items-center gap-3 px-5 py-4 text-left text-base text-white/70 hover:text-white hover:bg-white/5 transition-colors group rounded-2xl font-outfit"
                            >
                                <Search size={16} className="text-white/20 group-hover:text-[#6EE7F9] transition-colors" />
                                {company}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
