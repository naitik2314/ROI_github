"use client";

import { motion } from "framer-motion";
import usa from "@svg-maps/usa";
import { stateCoordinates } from "@/lib/stateCoordinates";
import { useState, useEffect, useMemo } from "react";
import { feature } from "topojson-client";
import { geoPath } from "d3-geo";

interface MapBackgroundProps {
    focusedState?: string;
    zoomMultiplier?: number;
    companyLocation?: { lat: number; lng: number };
}

export default function MapBackground({ focusedState, zoomMultiplier = 1, companyLocation }: MapBackgroundProps) {
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

    // --- Zoom config ---
    // transformOrigin keeps the state's anchor point fixed while scaling.
    // We then translate the anchor point to the screen center:
    //   tx = screenW × (0.5 − originX)
    //   ty = screenH × (0.5 − originY)
    const targetConfig = useMemo(() => {
        if (!focusedState || !stateCoordinates[focusedState] || vp.w === 0) {
            return { scale: 1, x: 0, y: 0, originX: 0.5, originY: 0.5 };
        }
        const state = stateCoordinates[focusedState];
        const originX = state.x / mapWidth;
        const originY = state.y / mapHeight;
        return {
            scale: state.scale * zoomMultiplier,
            x: vp.w * (0.5 - originX),
            y: vp.h * (0.5 - originY),
            originX,
            originY,
        };
    }, [focusedState, mapWidth, mapHeight, zoomMultiplier, vp]);

    // --- Counties (faint layer) ---
    const [counties, setCounties] = useState<any[]>([]);
    const [countiesLoaded, setCountiesLoaded] = useState(false);

    useEffect(() => {
        fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json')
            .then(res => res.json())
            .then(data => {
                // @ts-ignore
                const features = feature(data, data.objects.counties).features;
                setCounties(features);
                setCountiesLoaded(true);
            })
            .catch(err => console.error("Failed to load counties", err));
    }, []);


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
                style={{
                    transformOrigin: `${targetConfig.originX * 100}% ${targetConfig.originY * 100}%`
                }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
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
                        </defs>

                        {/* Counties layer */}
                        {countiesLoaded && (
                            <g className="opacity-[0.15] fill-none stroke-white/20" style={{ strokeWidth: "0.5px" }}>
                                {counties.map((county, i) => (
                                    <path key={i} d={geoPath()(county) || ""} />
                                ))}
                            </g>
                        )}

                        {/* States layer */}
                        {usa.locations.map((loc: { id: string; name: string; path: string }) => {
                            const isFocused = focusedState === loc.id.toUpperCase();
                            return (
                                <motion.path
                                    key={loc.id}
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
                                    {isFocused && (
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
