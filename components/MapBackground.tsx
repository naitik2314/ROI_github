"use client";

import { motion } from "framer-motion";
import usa from "@svg-maps/usa";
import { stateCoordinates } from "@/lib/stateCoordinates";
import { useState, useEffect, useMemo } from "react";
import { feature } from "topojson-client";
import { geoPath } from "d3-geo";

interface MapBackgroundProps {
    focusedState?: string;
    focusedCounty?: string;
    zoomMultiplier?: number;
    companyLocation?: { lat: number; lng: number };
    loadingStage?: 'idle' | 'flash' | 'hex_layer' | 'point_layer' | 'complete';
}

export default function MapBackground({ focusedState, focusedCounty, zoomMultiplier = 1, companyLocation, loadingStage = 'idle' }: MapBackgroundProps) {
    const viewBox = usa.viewBox.split(" ").map(Number);
    const mapWidth = viewBox[2] || 959;
    const mapHeight = viewBox[3] || 593;

    // Track viewport size so we can compute the centering translation
    const [vp, setVp] = useState({ w: 0, h: 0 });
    useEffect(() => {
        const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // --- Counties (faint layer) ---
    const [counties, setCounties] = useState<any[]>([]);
    const [countiesLoaded, setCountiesLoaded] = useState(false);

    useEffect(() => {
        fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-albers-10m.json')
            .then(res => res.json())
            .then(data => {
                // @ts-ignore
                const features = feature(data, data.objects.counties).features;
                setCounties(features);
                setCountiesLoaded(true);
            })
            .catch(err => console.error("Failed to load counties", err));
    }, []);

    // --- Zoom config ---
    // transformOrigin keeps the state's anchor point fixed while scaling.
    // We then translate the anchor point to the screen center:
    //   tx = screenW × (0.5 − originX)
    //   ty = screenH × (0.5 − originY)
    const targetConfig = useMemo(() => {
        if (!focusedState || !stateCoordinates[focusedState] || vp.w === 0) {
            return { scale: 1, x: 0, y: 0, originX: 0.5, originY: 0.5 };
        }

        // 1. Try to find the focused county
        let originX, originY, scale;
        let countyCentroid: [number, number] | null = null;
        let countyFound = false;

        if (focusedCounty && countiesLoaded && counties.length > 0) {
            const cleanCountyName = focusedCounty.toLowerCase().replace(' county', '').trim();
            const targetCounty = counties.find(c => 
                c.properties?.name?.toLowerCase() === cleanCountyName || 
                c.properties?.name?.toLowerCase().includes(cleanCountyName)
            );
            
            if (targetCounty) {
                // @ts-ignore
                const centroid = geoPath().centroid(targetCounty);
                if (centroid && !isNaN(centroid[0])) {
                    originX = centroid[0] / 975;
                    originY = centroid[1] / 610;
                    scale = 8 * zoomMultiplier; // Deep zoom into county
                    countyCentroid = centroid as [number, number];
                    countyFound = true;
                }
            }
        }

        // 2. Fallback to state zoom
        if (!countyFound) {
            const state = stateCoordinates[focusedState];
            originX = state.x / mapWidth;
            originY = state.y / mapHeight;
            scale = state.scale * zoomMultiplier;
        }

        const finalScale = scale ?? 1;
        return {
            scale: finalScale,
            x: vp.w * (0.5 - (originX ?? 0.5)) * finalScale,
            y: vp.h * (0.5 - (originY ?? 0.5)) * finalScale,
            countyCentroid
        };
    }, [focusedState, focusedCounty, counties, countiesLoaded, mapWidth, mapHeight, zoomMultiplier, vp]);


    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "50px 50px",
                }}
                aria-hidden="true"
            />

            {/* Map Container — CSS transforms for zoom */}
            <motion.div
                className="absolute inset-0 z-0 flex items-center justify-center transform-gpu"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{
                    opacity: 1,
                    scale: targetConfig.scale,
                    x: targetConfig.x,
                    y: targetConfig.y,
                }}
                transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <svg
                        viewBox={usa.viewBox}
                        preserveAspectRatio="xMidYMid meet"
                        className="w-[90%] h-[90%]"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <filter id="state-glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <radialGradient id="focused-fill" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#6EE7F9" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.3" />
                            </radialGradient>
                            <radialGradient id="dot-gradient" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                                <stop offset="100%" stopColor="#6EE7F9" stopOpacity="0.8" />
                            </radialGradient>
                            <pattern id="hexagons" width="40" height="69.28" patternUnits="userSpaceOnUse" patternTransform="scale(0.15)">
                                <path 
                                    d="M40 17.32L40 51.96L10 69.28L-20 51.96L-20 17.32L10 0L40 17.32ZM10 69.28L10 103.92L40 121.24L70 103.92L70 69.28L40 51.96L10 69.28ZM70 17.32L70 51.96L40 69.28L10 51.96L10 17.32L40 0L70 17.32ZM40 -17.32L40 17.32L10 34.64L-20 17.32L-20 -17.32L10 -34.64L40 -17.32Z" 
                                    fill="none" 
                                    stroke="#6EE7F9" 
                                    strokeWidth="2" 
                                    strokeOpacity="0.3" 
                                />
                            </pattern>
                            <filter id="hex-glow">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Counties layer (scaled to align us-atlas 975x610 with svg-maps 959x593) */}
                        {countiesLoaded && (
                            <g transform={`scale(${mapWidth / 975}, ${mapHeight / 610})`}>
                                <g className="opacity-[0.15] fill-none stroke-white/20" style={{ strokeWidth: "0.5px" }}>
                                    {counties.map((county, i) => {
                                        const isCountyFocused = focusedCounty && 
                                            county.properties?.name?.toLowerCase() === focusedCounty.toLowerCase().replace(' county', '').trim() &&
                                            focusedState;
                                        
                                        const pathD = geoPath()(county) || "";
                                        
                                        if (isCountyFocused && loadingStage !== 'idle') {
                                            const [cx, cy] = targetConfig.countyCentroid || [0, 0];
                                            return (
                                                <g key={`focused-county-group-${i}`} className="z-50 relative">
                                                    <motion.path 
                                                        d={pathD} 
                                                        fill="url(#focused-fill)"
                                                        stroke="#A78BFA"
                                                        strokeWidth="1.5"
                                                        vectorEffect="non-scaling-stroke"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                    />
                                                    {/* Premium Futuristic HUD Target Reticle */}
                                                    {targetConfig.countyCentroid && (loadingStage === 'hex_layer' || loadingStage === 'point_layer' || loadingStage === 'complete') && (
                                                        <g transform={`translate(${cx}, ${cy})`}>
                                                            {/* Core Energy Node */}
                                                            <circle cx="0" cy="0" r="0.8" fill="#FFFFFF" filter="url(#state-glow)" />
                                                            <circle cx="0" cy="0" r="1.5" fill="#6EE7F9" opacity="0.8" />
                                                            
                                                            {/* Rotating Data Ring with Dashes */}
                                                            <motion.circle 
                                                                cx="0" cy="0" r="5" 
                                                                fill="none" stroke="#6EE7F9" strokeWidth="0.3" 
                                                                strokeDasharray="1.5 2"
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                                            />
                                                            
                                                            {/* Reverse Rotating Outer Ring */}
                                                            <motion.circle 
                                                                cx="0" cy="0" r="8" 
                                                                fill="none" stroke="#A78BFA" strokeWidth="0.25" 
                                                                strokeDasharray="4 8"
                                                                animate={{ rotate: -360 }}
                                                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                            />
                                                            
                                                            {/* Crosshair / Targeting Brackets */}
                                                            <g stroke="#A78BFA" strokeWidth="0.4" opacity="0.8">
                                                                <path d="M 0 -10 L 0 -13 M 0 10 L 0 13 M -10 0 L -13 0 M 10 0 L 13 0" />
                                                                <path d="M -6 -6 L -7.5 -7.5 M 6 -6 L 7.5 -7.5 M -6 6 L -7.5 7.5 M 6 6 L 7.5 7.5" strokeWidth="0.2" opacity="0.5" />
                                                            </g>

                                                            {/* Scanning Arc overlay */}
                                                            <motion.path 
                                                                d="M -9 -9 A 12.7 12.7 0 0 1 9 -9" 
                                                                fill="none" stroke="#6EE7F9" strokeWidth="0.5" 
                                                                animate={{ rotate: [0, 360] }}
                                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                            />
                                                            
                                                            {/* Subtle Energy Pulse (Shockwave) */}
                                                            <motion.circle 
                                                                cx="0" cy="0" r="2" 
                                                                fill="none" stroke="#6EE7F9" strokeWidth="0.4"
                                                                animate={{ scale: [1, 20], opacity: [0.6, 0] }}
                                                                transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 1 }}
                                                            />
                                                        </g>
                                                    )}
                                                </g>
                                            );
                                        }

                                        return <path key={`county-${i}`} d={pathD} />;
                                    })}
                                </g>
                            </g>
                        )}

                        {/* States layer */}
                        {usa.locations.map((loc: { id: string; name: string; path: string }) => {
                            const isFocused = focusedState === loc.id.toUpperCase();
                            const showHex = isFocused && (loadingStage === 'hex_layer' || loadingStage === 'point_layer' || loadingStage === 'complete');
                            const showPoints = isFocused && (loadingStage === 'point_layer' || loadingStage === 'complete');

                            return (
                                <g key={loc.id}>
                                    <clipPath id={`clip-${loc.id}`}>
                                        <path d={loc.path} />
                                    </clipPath>
                                    
                                    <motion.path
                                        d={loc.path}
                                        initial={false}
                                        animate={{
                                            fillOpacity: isFocused ? 0.65 : 0.2,
                                            strokeOpacity: isFocused ? 1 : 0.15,
                                        }}
                                        fill={isFocused ? "url(#focused-fill)" : "#4B5563"}
                                        transition={{ duration: 0.8 }}
                                        stroke={isFocused ? "#6EE7F9" : "white"}
                                        strokeWidth={isFocused ? "2" : "1"}
                                        vectorEffect="non-scaling-stroke"
                                        aria-label={loc.name}
                                        filter={isFocused ? "url(#state-glow)" : undefined}
                                    >
                                        {isFocused && loadingStage === 'flash' && (
                                            <>
                                                <animate
                                                    attributeName="stroke-opacity"
                                                    values="1;0.3;1"
                                                    dur="2s"
                                                    repeatCount="indefinite"
                                                />
                                                <animate
                                                    attributeName="stroke-width"
                                                    values="2;3.5;2"
                                                    dur="2s"
                                                    repeatCount="indefinite"
                                                />
                                            </>
                                        )}
                                    </motion.path>

                                    {/* Hex Layer */}
                                    {showHex && (
                                        <motion.path
                                            d={loc.path}
                                            fill="url(#hexagons)"
                                            filter="url(#hex-glow)"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 1.5 }}
                                        />
                                    )}

                                    {/* Data Points Layer */}
                                    {showPoints && (
                                        <motion.g 
                                            clipPath={`url(#clip-${loc.id})`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 1 }}
                                        >
                                            {/* Generate deterministic seeded pseudo-random particles inside the rect encompassing everything */}
                                            {Array.from({length: 150}).map((_, i) => {
                                                // Seeded so they don't jump around on re-renders
                                                const seedX = Math.sin(i * 12.9898) * 10000;
                                                const seedY = Math.cos(i * 78.233) * 10000;
                                                const x = (seedX - Math.floor(seedX)) * mapWidth;
                                                const y = (seedY - Math.floor(seedY)) * mapHeight;
                                                const radius = ((Math.sin(i) + 1) / 2) * 2.5 + 0.5;
                                                const duration = ((Math.cos(i) + 1) / 2) * 2 + 1.5;

                                                const size = radius * 0.7; // slightly smaller so it looks sharp
                                                return (
                                                    <g key={`dot-${i}`} transform={`translate(${x}, ${y})`}>
                                                        <motion.rect
                                                            x={-size}
                                                            y={-size}
                                                            width={size * 2}
                                                            height={size * 2}
                                                            fill={i % 3 === 0 ? "#A78BFA" : "#6EE7F9"}
                                                            filter="url(#state-glow)"
                                                            initial={{ opacity: 0, rotate: 45, scale: 0 }}
                                                            animate={{
                                                                opacity: [0, 0.9, 0.3, 1, 0],
                                                                scale: [0, 1.2, 0.9, 1.4, 0],
                                                                rotate: [45, 45, 45, 45, 45]
                                                            }}
                                                            transition={{
                                                                duration: duration * 1.5,
                                                                repeat: Infinity,
                                                                times: [0, 0.15, 0.5, 0.85, 1],
                                                                delay: (i % 20) * 0.1,
                                                                ease: "easeInOut"
                                                            }}
                                                        />
                                                    </g>
                                                );
                                            })}
                                        </motion.g>
                                    )}
                                </g>
                            );
                        })}


                    </svg>
                </div>
            </motion.div>

            {/* Vignette */}
            <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 35%, rgba(8,12,23,0.85) 90%, rgba(8,12,23,1) 100%)"
                }}
                aria-hidden="true"
            />
        </div>
    );
}
