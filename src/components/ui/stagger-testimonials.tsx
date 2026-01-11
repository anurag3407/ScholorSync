"use client"

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SQRT_5000 = Math.sqrt(5000);

interface Testimonial {
    tempId: number;
    testimonial: string;
    by: string;
    imgSrc: string;
}

interface TestimonialCardProps {
    position: number;
    testimonial: Testimonial;
    handleMove: (steps: number) => void;
    cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
    position,
    testimonial,
    handleMove,
    cardSize
}) => {
    const isCenter = position === 0;

    return (
        <div
            onClick={() => handleMove(position)}
            className={cn(
                "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out",
                isCenter
                    ? "z-10 bg-teal-600 text-white border-teal-600 dark:bg-teal-500 dark:border-teal-500"
                    : "z-0 bg-card text-card-foreground border-border hover:border-teal-400/50 dark:hover:border-teal-600/50"
            )}
            style={{
                width: cardSize,
                height: cardSize,
                clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
                transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
                boxShadow: isCenter ? "0px 8px 0px 4px hsl(var(--border))" : "0px 0px 0px 0px transparent"
            }}
        >
            <span
                className="absolute block origin-top-right rotate-45 bg-border"
                style={{
                    right: -2,
                    top: 48,
                    width: SQRT_5000,
                    height: 2
                }}
            />
            <img
                src={testimonial.imgSrc}
                alt={`${testimonial.by.split(',')[0]}`}
                className="mb-4 h-14 w-12 bg-muted object-cover object-top rounded-sm"
                style={{
                    boxShadow: "3px 3px 0px hsl(var(--background))"
                }}
            />
            <h3 className={cn(
                "text-base sm:text-xl font-medium",
                isCenter ? "text-white" : "text-foreground"
            )}>
                &quot;{testimonial.testimonial}&quot;
            </h3>
            <p className={cn(
                "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
                isCenter ? "text-white/80" : "text-muted-foreground"
            )}>
                - {testimonial.by}
            </p>
        </div>
    );
};

interface StaggerTestimonialsProps {
    testimonials?: Testimonial[];
    className?: string;
}

export const StaggerTestimonials: React.FC<StaggerTestimonialsProps> = ({
    testimonials: initialTestimonials,
    className
}) => {
    const defaultTestimonials: Testimonial[] = [
        {
            tempId: 0,
            testimonial: "ScholarSync helped me find 5 scholarships I didn't even know existed. I've already received ₹50,000 in funding!",
            by: "Priya Sharma, Engineering Student, IIT Delhi",
            imgSrc: "https://i.pravatar.cc/150?img=1"
        },
        {
            tempId: 1,
            testimonial: "The Why Not Me feature showed me exactly what I needed to qualify for more scholarships. Game changer!",
            by: "Rahul Patel, Medical Student, AIIMS",
            imgSrc: "https://i.pravatar.cc/150?img=2"
        },
        {
            tempId: 2,
            testimonial: "Document vault saved me hours of work. Upload once and auto-fill applications everywhere.",
            by: "Ananya Gupta, Commerce Student, SRCC",
            imgSrc: "https://i.pravatar.cc/150?img=3"
        },
        {
            tempId: 3,
            testimonial: "The fee anomaly detector caught a ₹15,000 overcharge. This platform literally pays for itself!",
            by: "Vikram Singh, MBA Student, IIM Bangalore",
            imgSrc: "https://i.pravatar.cc/150?img=4"
        },
        {
            tempId: 4,
            testimonial: "I completed 3 fellowship challenges and earned ₹25,000 while still in college!",
            by: "Meera Krishnan, Design Student, NID",
            imgSrc: "https://i.pravatar.cc/150?img=5"
        },
        {
            tempId: 5,
            testimonial: "The AI matching is incredibly accurate. Every scholarship recommendation was relevant to me.",
            by: "Arjun Reddy, CS Student, IIIT Hyderabad",
            imgSrc: "https://i.pravatar.cc/150?img=6"
        },
        {
            tempId: 6,
            testimonial: "Smart notifications ensured I never missed a deadline. Got 3 scholarships this semester!",
            by: "Sneha Joshi, Law Student, NLU Delhi",
            imgSrc: "https://i.pravatar.cc/150?img=7"
        },
        {
            tempId: 7,
            testimonial: "The community features helped me connect with seniors who guided my applications.",
            by: "Karthik Menon, Architecture Student, SPA Delhi",
            imgSrc: "https://i.pravatar.cc/150?img=8"
        },
    ];

    const [cardSize, setCardSize] = useState(365);
    const [testimonialsList, setTestimonialsList] = useState(initialTestimonials || defaultTestimonials);

    const handleMove = (steps: number) => {
        const newList = [...testimonialsList];
        if (steps > 0) {
            for (let i = steps; i > 0; i--) {
                const item = newList.shift();
                if (!item) return;
                newList.push({ ...item, tempId: Math.random() });
            }
        } else {
            for (let i = steps; i < 0; i++) {
                const item = newList.pop();
                if (!item) return;
                newList.unshift({ ...item, tempId: Math.random() });
            }
        }
        setTestimonialsList(newList);
    };

    useEffect(() => {
        const updateSize = () => {
            const { matches } = window.matchMedia("(min-width: 640px)");
            setCardSize(matches ? 365 : 290);
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    return (
        <div
            className={cn("relative w-full overflow-hidden bg-muted/30 rounded-2xl", className)}
            style={{ height: 600 }}
        >
            {testimonialsList.map((testimonial, index) => {
                const position = testimonialsList.length % 2
                    ? index - (testimonialsList.length + 1) / 2
                    : index - testimonialsList.length / 2;
                return (
                    <TestimonialCard
                        key={testimonial.tempId}
                        testimonial={testimonial}
                        handleMove={handleMove}
                        position={position}
                        cardSize={cardSize}
                    />
                );
            })}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                <button
                    onClick={() => handleMove(-1)}
                    className={cn(
                        "flex h-14 w-14 items-center justify-center text-2xl transition-colors rounded-lg",
                        "bg-background border-2 border-border hover:bg-teal-600 hover:text-white hover:border-teal-600",
                        "dark:hover:bg-teal-500 dark:hover:border-teal-500",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    aria-label="Previous testimonial"
                >
                    <ChevronLeft />
                </button>
                <button
                    onClick={() => handleMove(1)}
                    className={cn(
                        "flex h-14 w-14 items-center justify-center text-2xl transition-colors rounded-lg",
                        "bg-background border-2 border-border hover:bg-teal-600 hover:text-white hover:border-teal-600",
                        "dark:hover:bg-teal-500 dark:hover:border-teal-500",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    aria-label="Next testimonial"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
};
