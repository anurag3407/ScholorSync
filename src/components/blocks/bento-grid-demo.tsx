"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
    IconClipboardCopy,
    IconFileBroken,
    IconSignature,
    IconTableColumn,
    IconBoxAlignRightFilled,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

export default function BentoGridDemo() {
    return (
        <BentoGrid className="max-w-5xl mx-auto md:auto-rows-[20rem]">
            {items.map((item, i) => (
                <BentoGridItem
                    key={i}
                    title={item.title}
                    description={item.description}
                    header={item.header}
                    className={cn("[&>p:text-lg]", item.className)}
                    icon={item.icon}
                />
            ))}
        </BentoGrid>
    );
}

// Skeleton: AI Matching Animation
const SkeletonOne = () => {
    const variants = {
        initial: { x: 0 },
        animate: {
            x: 10,
            rotate: 5,
            transition: { duration: 0.2 },
        },
    };
    const variantsSecond = {
        initial: { x: 0 },
        animate: {
            x: -10,
            rotate: -5,
            transition: { duration: 0.2 },
        },
    };

    return (
        <motion.div
            initial="initial"
            whileHover="animate"
            className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 flex-col space-y-2 p-4 rounded-lg"
        >
            <motion.div
                variants={variants}
                className="flex flex-row rounded-full border border-slate-200 dark:border-teal-900/30 p-2 items-center space-x-2 bg-white dark:bg-slate-900"
            >
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 shrink-0" />
                <div className="w-full bg-slate-100 h-4 rounded-full dark:bg-slate-800" />
            </motion.div>
            <motion.div
                variants={variantsSecond}
                className="flex flex-row rounded-full border border-slate-200 dark:border-teal-900/30 p-2 items-center space-x-2 w-3/4 ml-auto bg-white dark:bg-slate-900"
            >
                <div className="w-full bg-slate-100 h-4 rounded-full dark:bg-slate-800" />
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 shrink-0" />
            </motion.div>
            <motion.div
                variants={variants}
                className="flex flex-row rounded-full border border-slate-200 dark:border-teal-900/30 p-2 items-center space-x-2 bg-white dark:bg-slate-900"
            >
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 shrink-0" />
                <div className="w-full bg-slate-100 h-4 rounded-full dark:bg-slate-800" />
            </motion.div>
        </motion.div>
    );
};

// Skeleton: Document Processing Animation
const SkeletonTwo = () => {
    const variants = {
        initial: { width: 0 },
        animate: { width: "100%", transition: { duration: 0.2 } },
        hover: { width: ["0%", "100%"], transition: { duration: 2 } },
    };
    const arr = new Array(6).fill(0);

    return (
        <motion.div
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 flex-col space-y-2 p-4 rounded-lg"
        >
            {arr.map((_, i) => (
                <motion.div
                    key={"skeleton-two" + i}
                    variants={variants}
                    style={{ maxWidth: Math.random() * (100 - 40) + 40 + "%" }}
                    className="flex flex-row rounded-full border border-slate-200 dark:border-teal-900/30 p-2 items-center space-x-2 bg-slate-100 dark:bg-slate-800 w-full h-4"
                />
            ))}
        </motion.div>
    );
};

// Skeleton: Gradient Animation for Fee Tracker
const SkeletonThree = () => {
    const variants = {
        initial: { backgroundPosition: "0 50%" },
        animate: { backgroundPosition: ["0, 50%", "100% 50%", "0 50%"] },
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={variants}
            transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
            className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg flex-col space-y-2"
            style={{
                background: "linear-gradient(-45deg, #14b8a6, #10b981, #0ea5e9, #6366f1)",
                backgroundSize: "400% 400%",
            }}
        >
            <motion.div className="h-full w-full rounded-lg" />
        </motion.div>
    );
};

// Skeleton: Match Comparison Cards
const SkeletonFour = () => {
    const first = { initial: { x: 20, rotate: -5 }, hover: { x: 0, rotate: 0 } };
    const second = { initial: { x: -20, rotate: 5 }, hover: { x: 0, rotate: 0 } };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 flex-row space-x-2 p-2 rounded-lg"
        >
            <motion.div
                variants={first}
                className="h-full w-1/3 rounded-2xl bg-white p-4 dark:bg-slate-900 dark:border-teal-900/30 border border-slate-200 flex flex-col items-center justify-center"
            >
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-400 to-orange-400" />
                <p className="sm:text-sm text-xs text-center font-semibold text-slate-500 mt-4">
                    Low Match
                </p>
                <p className="border border-red-500 bg-red-100 dark:bg-red-900/20 text-red-600 text-xs rounded-full px-2 py-0.5 mt-4">
                    35%
                </p>
            </motion.div>
            <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-white p-4 dark:bg-slate-900 dark:border-teal-900/30 border border-slate-200 flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400" />
                <p className="sm:text-sm text-xs text-center font-semibold text-slate-500 mt-4">
                    Perfect Match
                </p>
                <p className="border border-teal-500 bg-teal-100 dark:bg-teal-900/20 text-teal-600 text-xs rounded-full px-2 py-0.5 mt-4">
                    95%
                </p>
            </motion.div>
            <motion.div
                variants={second}
                className="h-full w-1/3 rounded-2xl bg-white p-4 dark:bg-slate-900 dark:border-teal-900/30 border border-slate-200 flex flex-col items-center justify-center"
            >
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400" />
                <p className="sm:text-sm text-xs text-center font-semibold text-slate-500 mt-4">
                    Good Match
                </p>
                <p className="border border-amber-500 bg-amber-100 dark:bg-amber-900/20 text-amber-600 text-xs rounded-full px-2 py-0.5 mt-4">
                    72%
                </p>
            </motion.div>
        </motion.div>
    );
};

// Skeleton: Chat/Community Animation
const SkeletonFive = () => {
    const variants = {
        initial: { x: 0 },
        animate: { x: 10, rotate: 5, transition: { duration: 0.2 } },
    };
    const variantsSecond = {
        initial: { x: 0 },
        animate: { x: -10, rotate: -5, transition: { duration: 0.2 } },
    };

    return (
        <motion.div
            initial="initial"
            whileHover="animate"
            className="flex flex-1 w-full h-full min-h-[6rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 flex-col space-y-2 p-4 rounded-lg"
        >
            <motion.div
                variants={variants}
                className="flex flex-row rounded-2xl border border-slate-200 dark:border-teal-900/30 p-2 items-start space-x-2 bg-white dark:bg-slate-900"
            >
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    I got the PM YASASVI scholarship! Here&apos;s how I prepared my documents...
                </p>
            </motion.div>
            <motion.div
                variants={variantsSecond}
                className="flex flex-row rounded-full border border-slate-200 dark:border-teal-900/30 p-2 items-center justify-end space-x-2 w-3/4 ml-auto bg-white dark:bg-slate-900"
            >
                <p className="text-xs text-slate-500 dark:text-slate-400">Thanks! This helped a lot 🎉</p>
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shrink-0" />
            </motion.div>
        </motion.div>
    );
};

const items = [
    {
        title: "AI Scholarship Matching",
        description: (
            <span className="text-sm">
                Get personalized match scores based on your profile and eligibility.
            </span>
        ),
        header: <SkeletonOne />,
        className: "md:col-span-1",
        icon: <IconClipboardCopy className="h-4 w-4 text-teal-500" />,
    },
    {
        title: "Smart Document Processing",
        description: (
            <span className="text-sm">
                Upload once, auto-fill everywhere with OCR technology.
            </span>
        ),
        header: <SkeletonTwo />,
        className: "md:col-span-1",
        icon: <IconFileBroken className="h-4 w-4 text-teal-500" />,
    },
    {
        title: "Fee Anomaly Detection",
        description: (
            <span className="text-sm">
                Compare your fees against official structures instantly.
            </span>
        ),
        header: <SkeletonThree />,
        className: "md:col-span-1",
        icon: <IconSignature className="h-4 w-4 text-teal-500" />,
    },
    {
        title: "Match Score Comparison",
        description: (
            <span className="text-sm">
                See how you compare across different scholarships at a glance.
            </span>
        ),
        header: <SkeletonFour />,
        className: "md:col-span-2",
        icon: <IconTableColumn className="h-4 w-4 text-teal-500" />,
    },
    {
        title: "Community Insights",
        description: (
            <span className="text-sm">
                Learn from successful applicants and share your experience.
            </span>
        ),
        header: <SkeletonFive />,
        className: "md:col-span-1",
        icon: <IconBoxAlignRightFilled className="h-4 w-4 text-teal-500" />,
    },
];
