"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap } from "lucide-react";
import createGlobe, { COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const GLOBE_CONFIG: COBEOptions = {
    width: 800,
    height: 800,
    onRender: () => { },
    devicePixelRatio: 2,
    phi: 0,
    theta: 0.3,
    dark: 0,
    diffuse: 0.4,
    mapSamples: 16000,
    mapBrightness: 1.2,
    baseColor: [1, 1, 1],
    markerColor: [20 / 255, 184 / 255, 166 / 255], // Teal color
    glowColor: [1, 1, 1],
    markers: [
        // India - Major cities
        { location: [28.6139, 77.209], size: 0.1 }, // Delhi
        { location: [19.076, 72.8777], size: 0.08 }, // Mumbai
        { location: [12.9716, 77.5946], size: 0.07 }, // Bangalore
        { location: [13.0827, 80.2707], size: 0.06 }, // Chennai
        { location: [22.5726, 88.3639], size: 0.06 }, // Kolkata
        { location: [17.385, 78.4867], size: 0.05 }, // Hyderabad
        // International
        { location: [51.5074, -0.1278], size: 0.04 }, // London
        { location: [40.7128, -74.006], size: 0.04 }, // New York
        { location: [1.3521, 103.8198], size: 0.04 }, // Singapore
        { location: [35.6762, 139.6503], size: 0.03 }, // Tokyo
        { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney
    ],
};

export function Globe({
    className,
    config = GLOBE_CONFIG,
}: {
    className?: string;
    config?: COBEOptions;
}) {
    let phi = 0;
    let width = 0;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<number | null>(null);
    const pointerInteractionMovement = useRef(0);
    const [r, setR] = useState(0);

    const updatePointerInteraction = (value: number | null) => {
        pointerInteracting.current = value;
        if (canvasRef.current) {
            canvasRef.current.style.cursor = value ? "grabbing" : "grab";
        }
    };

    const updateMovement = (clientX: number) => {
        if (pointerInteracting.current !== null) {
            const delta = clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            setR(delta / 200);
        }
    };

    const onRender = useCallback(
        (state: Record<string, number>) => {
            if (!pointerInteracting.current) phi += 0.005;
            state.phi = phi + r;
            state.width = width * 2;
            state.height = width * 2;
        },
        [r]
    );

    const onResize = () => {
        if (canvasRef.current) {
            width = canvasRef.current.offsetWidth;
        }
    };

    useEffect(() => {
        window.addEventListener("resize", onResize);
        onResize();

        const globe = createGlobe(canvasRef.current!, {
            ...config,
            width: width * 2,
            height: width * 2,
            onRender,
        });

        setTimeout(() => {
            if (canvasRef.current) {
                canvasRef.current.style.opacity = "1";
            }
        });
        return () => globe.destroy();
    }, [config, onRender]);

    return (
        <div
            className={cn(
                "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
                className
            )}
        >
            <canvas
                className={cn(
                    "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
                )}
                ref={canvasRef}
                onPointerDown={(e) =>
                    updatePointerInteraction(
                        e.clientX - pointerInteractionMovement.current
                    )
                }
                onPointerUp={() => updatePointerInteraction(null)}
                onPointerOut={() => updatePointerInteraction(null)}
                onMouseMove={(e) => updateMovement(e.clientX)}
                onTouchMove={(e) =>
                    e.touches[0] && updateMovement(e.touches[0].clientX)
                }
            />
        </div>
    );
}

interface GlobeFeatureSectionProps {
    className?: string;
}

export default function GlobeFeatureSection({ className }: GlobeFeatureSectionProps) {
    return (
        <section
            className={cn(
                "relative w-full mx-auto overflow-hidden rounded-3xl bg-muted border border-border shadow-md px-6 py-16 md:px-16 md:py-24",
                className
            )}
        >
            <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
                <div className="z-10 max-w-xl text-left">
                    <h2 className="text-3xl font-bold text-foreground">
                        Join{" "}
                        <span className="text-teal-600 dark:text-teal-400">50,000+</span>{" "}
                        Students Worldwide
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        ScholarSync connects students from top universities across India
                        and 20+ countries. Find scholarships, track applications, and
                        connect with a global community of learners.
                    </p>
                    <Link href="/auth/register">
                        <Button className="mt-6 gap-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600">
                            Join the Community <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
                <div className="relative h-[200px] w-full max-w-xl md:h-[250px]">
                    <Globe className="absolute -bottom-24 -right-20 md:-bottom-32 md:-right-28 scale-125 md:scale-150" />
                </div>
            </div>
        </section>
    );
}
