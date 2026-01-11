"use client";

import React from "react";
import Link from "next/link";
import {
    GraduationCap,
    Twitter,
    Linkedin,
    Github,
    Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterLink {
    label: string;
    href: string;
}

interface SocialLink {
    icon: React.ReactNode;
    href: string;
    label: string;
}

interface AnimatedFooterProps {
    brandName?: string;
    brandDescription?: string;
    socialLinks?: SocialLink[];
    navLinks?: FooterLink[];
    creatorName?: string;
    creatorUrl?: string;
    brandIcon?: React.ReactNode;
    className?: string;
}

const defaultSocialLinks: SocialLink[] = [
    {
        icon: <Twitter className="w-5 h-5" />,
        href: "https://twitter.com",
        label: "Twitter",
    },
    {
        icon: <Linkedin className="w-5 h-5" />,
        href: "https://linkedin.com",
        label: "LinkedIn",
    },
    {
        icon: <Github className="w-5 h-5" />,
        href: "https://github.com",
        label: "GitHub",
    },
    {
        icon: <Mail className="w-5 h-5" />,
        href: "mailto:contact@scholarsync.com",
        label: "Email",
    },
];

const defaultNavLinks: FooterLink[] = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Contact", href: "/contact" },
];

export const AnimatedFooter = ({
    brandName = "ScholarSync",
    brandDescription = "Your AI-powered scholarship finder, document vault, and fee tracker. Helping students secure funding for their education.",
    socialLinks = defaultSocialLinks,
    navLinks = defaultNavLinks,
    creatorName,
    creatorUrl,
    brandIcon,
    className,
}: AnimatedFooterProps) => {
    return (
        <section className={cn("relative w-full mt-0 overflow-hidden", className)}>
            <footer className="border-t border-border bg-background mt-20 relative">
                <div className="max-w-7xl flex flex-col justify-between mx-auto min-h-[28rem] sm:min-h-[32rem] md:min-h-[36rem] relative p-4 py-10">
                    <div className="flex flex-col mb-12 sm:mb-20 md:mb-0 w-full">
                        <div className="w-full flex flex-col items-center">
                            <div className="space-y-2 flex flex-col items-center flex-1">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                                    <span className="text-foreground text-2xl font-bold">
                                        {brandName}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm text-center w-full max-w-md px-4 sm:px-0">
                                    {brandDescription}
                                </p>
                            </div>

                            {socialLinks.length > 0 && (
                                <div className="flex mb-6 mt-4 gap-4">
                                    {socialLinks.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.href}
                                            className="text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <div className="w-5 h-5 hover:scale-110 duration-300">
                                                {link.icon}
                                            </div>
                                            <span className="sr-only">{link.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {navLinks.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground max-w-full px-4">
                                    {navLinks.map((link, index) => (
                                        <Link
                                            key={index}
                                            className="hover:text-teal-600 dark:hover:text-teal-400 duration-300 transition-colors"
                                            href={link.href}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-16 md:mt-20 flex flex-col gap-2 md:gap-1 items-center justify-center md:flex-row md:items-center md:justify-between px-4 md:px-0">
                        <p className="text-sm text-muted-foreground text-center md:text-left">
                            ©{new Date().getFullYear()} {brandName}. All rights reserved.
                        </p>
                        {creatorName && creatorUrl && (
                            <nav className="flex gap-4">
                                <Link
                                    href={creatorUrl}
                                    target="_blank"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                                >
                                    Crafted by {creatorName}
                                </Link>
                            </nav>
                        )}
                    </div>
                </div>

                {/* Large background text */}
                <div
                    className="bg-gradient-to-b from-teal-500/20 via-teal-500/10 to-transparent dark:from-teal-400/15 dark:via-teal-400/5 bg-clip-text text-transparent leading-none absolute left-1/2 -translate-x-1/2 bottom-36 md:bottom-28 font-extrabold tracking-tighter pointer-events-none select-none text-center px-4"
                    style={{
                        fontSize: 'clamp(2.5rem, 10vw, 8rem)',
                        maxWidth: '95vw'
                    }}
                >
                    {brandName.toUpperCase()}
                </div>

                {/* Bottom logo */}
                <div className="absolute hover:border-teal-500 duration-400 drop-shadow-[0_0px_15px_rgba(20,184,166,0.3)] dark:drop-shadow-[0_0px_20px_rgba(94,234,212,0.2)] bottom-20 md:bottom-16 backdrop-blur-sm rounded-2xl bg-background/80 left-1/2 border-2 border-border flex items-center justify-center p-2 -translate-x-1/2 z-10">
                    <div className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                        {brandIcon || (
                            <GraduationCap className="w-6 sm:w-8 md:w-10 h-6 sm:h-8 md:h-10 text-white drop-shadow-lg" />
                        )}
                    </div>
                </div>

                {/* Bottom line */}
                <div className="absolute bottom-28 sm:bottom-30 backdrop-blur-sm h-px bg-gradient-to-r from-transparent via-border to-transparent w-full left-1/2 -translate-x-1/2"></div>

                {/* Bottom shadow */}
                <div className="bg-gradient-to-t from-background via-background/80 blur-[1em] to-background/40 absolute bottom-24 w-full h-20 pointer-events-none"></div>
            </footer>
        </section>
    );
};
