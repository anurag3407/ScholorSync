"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, Sparkles, Target, FileText, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
    icon: React.ElementType;
    title: string;
    description: string;
}

interface FeaturesGridProps {
    features?: Feature[];
    className?: string;
}

const defaultFeatures: Feature[] = [
    {
        icon: Target,
        title: "AI-Powered Matching",
        description: "Our AI analyzes your profile against 10,000+ scholarships to find your best matches with personalized eligibility scores."
    },
    {
        icon: Sparkles,
        title: "Why Not Me? Analyzer",
        description: "Discover near-miss scholarships and get actionable steps to become eligible. Turn 'almost qualified' into 'approved'."
    },
    {
        icon: FileText,
        title: "Smart Document Vault",
        description: "Upload once, auto-fill everywhere. Our OCR technology extracts data from certificates, IDs, and income proofs automatically."
    },
    {
        icon: Coins,
        title: "Fee Anomaly Detection",
        description: "Compare your fees against official structures. Our system flags discrepancies and helps you raise RTI requests."
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description: "Bank-level encryption protects your documents and personal information. Your data is never shared without consent."
    },
    {
        icon: Users,
        title: "Community Intelligence",
        description: "Learn from successful applicants, share insights, and get guidance from seniors who've secured funding."
    },
];

export function FeaturesGrid({ features = defaultFeatures, className }: FeaturesGridProps) {
    return (
        <section className={cn("py-16 md:py-24", className)}>
            <div className="mx-auto max-w-7xl px-6">
                <div className="relative">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((feature, index) => (
                            <Card
                                key={feature.title}
                                className={cn(
                                    "group relative overflow-hidden transition-all duration-300",
                                    "hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/10",
                                    "dark:hover:border-teal-700/50 dark:hover:shadow-teal-500/5",
                                    index === 0 && "md:col-span-2 lg:col-span-1"
                                )}
                            >
                                <CardContent className="p-6">
                                    <div className="relative z-10 flex flex-col gap-4">
                                        <div className="relative flex aspect-square size-12 rounded-xl border bg-teal-100 dark:bg-teal-950/50 items-center justify-center">
                                            <feature.icon className="size-6 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold text-foreground group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                                {feature.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Subtle gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-emerald-500/0 group-hover:from-teal-500/5 group-hover:to-emerald-500/5 transition-all duration-300" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
