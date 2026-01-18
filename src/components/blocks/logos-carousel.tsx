"use client";

import AutoScroll from "embla-carousel-auto-scroll";



import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";

interface Logo {
    id: string;
    description: string;
    image: string;
    className?: string;
}

interface LogosCarouselProps {
    heading?: string;
    logos?: Logo[];
    className?: string;
}

const defaultLogos: Logo[] = [
    {
        id: "logo-1",
        description: "IIT Delhi",
        image: "https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg/1200px-Indian_Institute_of_Technology_Delhi_Logo.svg.png",
        className: "h-20 w-auto",
    },
    {
        id: "logo-2",
        description: "IIM Ahmedabad",
        image: "/logos/iimr.png",
        className: "h-20 w-auto",
    },
    {
        id: "logo-3",
        description: "AIIMS",
        image: "/logos/aiims.png",
        className: "h-20 w-auto",
    },
    {
        id: "logo-4",
        description: "NIT Patna",
        image: "/logos/nitpatna.png",
        className: "h-20 w-auto",
    },
    {
        id: "logo-5",
        description: "BITS Pilani",
        image: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/BITS_Pilani-Logo.svg/1200px-BITS_Pilani-Logo.svg.png",
        className: "h-20 w-auto",
    },
    {
        id: "logo-6",
        description: "VIT",
        image: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Vellore_Institute_of_Technology_seal_2017.svg/1200px-Vellore_Institute_of_Technology_seal_2017.svg.png",
        className: "h-20 w-auto",
    },
    // {
    //     id: "logo-7",
    //     description: "SRM University",
    //     image: "https://upload.wikimedia.org/wikipedia/en/f/fe/Srmseal.png",
    //     className: "h-10 w-auto",
    // },
    {
        id: "logo-8",
        description: "Delhi University",
        image: "/logos/du.png",
        className: "h-20 w-auto",
    },
];

const LogosCarousel = ({
    heading = "Trusted by students from top universities",
    logos = defaultLogos,
    className,
}: LogosCarouselProps) => {
    return (
        <section className={className}>
            <div className="container flex flex-col items-center text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {heading}
                </p>
            </div>
            <div className="pt-8">
                <div className="relative mx-auto flex items-center justify-center lg:max-w-5xl">
                    <Carousel
                        opts={{ loop: true }}
                        plugins={[AutoScroll({ playOnInit: true, speed: 1 })]}
                    >
                        <CarouselContent className="ml-0">
                            {logos.map((logo) => (
                                <CarouselItem
                                    key={logo.id}
                                    className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                                >
                                    <div className="mx-10 flex shrink-0 items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                                        <div>
                                            <img
                                                src={logo.image}
                                                alt={logo.description}
                                                className={logo.className}
                                            />
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                    <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
                </div>
            </div>
        </section>
    );
};

export { LogosCarousel };
