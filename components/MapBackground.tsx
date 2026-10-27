"use client";

import { motion } from "framer-motion";
import usa from "@svg-maps/usa";
import { stateCoordinates } from "@/lib/stateCoordinates";
import { useState, useEffect, useMemo } from "react";
import { feature } from "topojson-client";
import { geoPath } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";

export default function MapBackground({ focusedState, zoomMultiplier = 1 }: { focusedState?: string, zoomMultiplier?: number, companyLocation?: { lat: number, lng: number } }) {
    // Parse viewBox to get dimensions (usually "0 0 959 593")
    const viewBox = usa.viewBox.split(" ").map(Number);
    const mapWidth = viewBox[2] || 959;
    const mapHeight = viewBox[3] || 593;

    const targetConfig = useMemo(() => {
        if (!focusedState || !stateCoordinates[focusedState]) {
            return {
                scale: 1,
                x: 0,
                y: 0,
                originX: 0.5,
                originY: 0.5
            };
        }

        const state = stateCoordinates[focusedState];
        // Calculate origin as percentage of map dimensions
        const originX = state.x / mapWidth;
        const originY = state.y / mapHeight;

        // Shift slightly to the right to leave room for the panel on the left
        // We want the target point to be at roughly 70% of the screen width
        // const xOffset = 200; // Pixels to shift right -> User requested centered

        return {
            scale: state.scale * zoomMultiplier,
            x: 0, // Centered
            y: 0, // Keep vertically centered
            originX,
            originY
        };
    }, [focusedState, mapWidth, mapHeight, zoomMultiplier]);

    // ... rest of rendering including counties ...

    const [counties, setCounties] = useState<Feature<Geometry>[]>([]);

    useEffect(() => {
        fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json')
            .then(res => res.json())
            .then(data => {
                const topology = data as Topology<{ counties: GeometryCollection }>;
                const features = feature(topology, topology.objects.counties).features;
                setCounties(features);
            })
            .catch(err => console.error("Failed to load counties", err));
    }, []);

    // Active states (could be passed in or just all active)

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-ink">
            {/* Map Container */}
            <motion.div
                className="absolute inset-0 z-0 flex items-center justify-center transform-gpu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                    opacity: 1,
                    scale: targetConfig.scale,
                    x: targetConfig.x,
                    y: targetConfig.y,
                }}
                style={{
                    transformOrigin: `${targetConfig.originX * 100}% ${targetConfig.originY * 100}%`
                }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} // smooth exponential
            >
                <div className="w-full h-full flex items-center justify-center">
                    <svg
                        viewBox={usa.viewBox}
                        preserveAspectRatio="xMidYMid meet"
                        className="w-[90%] h-[90%] text-white/10"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Counties Layer - Faint */}
                        <g className="opacity-20 text-white fill-none stroke-white/20 stroke-[0.5px]">
                            {counties.map((county, i) => (
                                <path key={i} d={geoPath()(county) || ""} />
                            ))}
                        </g>

                        {usa.locations.map((loc: { id: string, name: string, path: string }) => {
                            const isFocused = focusedState === loc.id.toUpperCase();
                            return (
                                <motion.path
                                    key={loc.id}
                                    d={loc.path}
                                    initial={false}
                                    animate={{
                                        fill: isFocused ? "#3b82f6" : "#374151", // This will be overridden by CSS glass effect potentially
                                        fillOpacity: isFocused ? 0.6 : 0.3,
                                        strokeOpacity: isFocused ? 0.8 : 0.15
                                    }}
                                    transition={{ duration: 1 }}
                                    stroke="white"
                                    strokeWidth={isFocused ? "2" : "1.5"}
                                    vectorEffect="non-scaling-stroke"
                                    aria-label={loc.name}
                                    className={isFocused ? "text-accent-start" : "text-white/10"}
                                />
                            );
                        })}
                    </svg>
                </div>
            </motion.div>

            {/* Subtle Vignette to keep focus center */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#0B0F1A_100%)] z-20 pointer-events-none" />
        </div>
    );
}

