"use client";
import React from "react";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";

export default function StarsHeroSection() {
    return (
        <div className="h-[40rem] rounded-2xl bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center relative w-full overflow-hidden">
            <h2 className="relative flex-col md:flex-row z-10 text-3xl md:text-5xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium flex items-center gap-2 md:gap-8 px-4">
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    Find Your Funding
                </span>
                <span className="text-slate-400 dark:text-slate-600 text-lg font-thin">✦</span>
                <span className="text-slate-800 dark:text-white">
                    Secure Your Future
                </span>
            </h2>
            <p className="relative z-10 mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl text-center px-4">
                Join 50,000+ students who have discovered scholarships worth ₹500Cr+ through ScholarSync
            </p>
            {/* Shooting stars - more visible in dark mode */}
            <ShootingStars
                starColor="#14b8a6"
                trailColor="#10b981"
                className="dark:opacity-100 opacity-50"
            />
            {/* Stars background - mainly for dark mode */}
            <StarsBackground
                starDensity={0.0002}
                className="dark:opacity-100 opacity-20"
            />
        </div>
    );
}
