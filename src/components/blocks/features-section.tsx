'use client';

import { cn } from "@/lib/utils";
import {
    Target,
    Sparkles,
    FileText,
    Receipt,
    Bell,
    Users,
    Coins,
    Shield,
} from "lucide-react";

const features = [
    {
        title: "Scholarship Radar",
        description:
            "AI-powered matching finds scholarships you actually qualify for with personalized match scores.",
        icon: <Target className="h-6 w-6" />,
    },
    {
        title: "Why Not Me? Analyzer",
        description:
            "Discover near-miss scholarships and get actionable steps to become eligible.",
        icon: <Sparkles className="h-6 w-6" />,
    },
    {
        title: "Document Vault",
        description:
            "Upload once, auto-fill everywhere. OCR extracts data from your documents automatically.",
        icon: <FileText className="h-6 w-6" />,
    },
    {
        title: "Fee Anomaly Detector",
        description:
            "Compare your fees against official structures to catch discrepancies instantly.",
        icon: <Receipt className="h-6 w-6" />,
    },
    {
        title: "Smart Notifications",
        description:
            "Never miss a deadline with personalized alerts for scholarships and applications.",
        icon: <Bell className="h-6 w-6" />,
    },
    {
        title: "Community Intelligence",
        description:
            "Learn from successful applicants and share insights with fellow students.",
        icon: <Users className="h-6 w-6" />,
    },
    {
        title: "Micro-Fellowships",
        description:
            "Earn money by solving real business challenges. Get paid while building your portfolio.",
        icon: <Coins className="h-6 w-6" />,
    },
    {
        title: "Privacy First",
        description:
            "Your data is encrypted and never shared. We only use it to find you scholarships.",
        icon: <Shield className="h-6 w-6" />,
    },
];

export default function FeaturesSection() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
            {features.map((feature, index) => (
                <Feature key={feature.title} {...feature} index={index} />
            ))}
        </div>
    );
}

const Feature = ({
    title,
    description,
    icon,
    index,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    index: number;
}) => {
    return (
        <div
            className={cn(
                "flex flex-col lg:border-r py-10 relative group/feature border-slate-200 dark:border-slate-700/50",
                (index === 0 || index === 4) && "lg:border-l border-slate-200 dark:border-slate-700/50",
                index < 4 && "lg:border-b border-slate-200 dark:border-slate-700/50"
            )}
        >
            {index < 4 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-teal-50 dark:from-teal-950/30 to-transparent pointer-events-none" />
            )}
            {index >= 4 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-teal-50 dark:from-teal-950/30 to-transparent pointer-events-none" />
            )}
            <div className="mb-4 relative z-10 px-10 text-teal-600 dark:text-teal-400">
                {icon}
            </div>
            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-slate-300 dark:bg-slate-700 group-hover/feature:bg-teal-500 transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-slate-900 dark:text-white">
                    {title}
                </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs relative z-10 px-10">
                {description}
            </p>
        </div>
    );
};
