import { cn } from "@/lib/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
                className,
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-xl border p-4 transition duration-200",
                // Light mode
                "border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-teal-300",
                // Dark mode
                "dark:border-teal-900/30 dark:bg-[#111118] dark:shadow-none dark:hover:border-teal-700/50 dark:hover:shadow-teal-500/10",
                className,
            )}
        >
            {header}
            <div className="transition duration-200 group-hover/bento:translate-x-2">
                {icon}
                <div className="mt-2 mb-2 font-sans font-bold text-slate-800 dark:text-slate-100">
                    {title}
                </div>
                <div className="font-sans text-xs font-normal text-slate-600 dark:text-slate-400">
                    {description}
                </div>
            </div>
        </div>
    );
};
