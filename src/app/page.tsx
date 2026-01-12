'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  FileText,
  Receipt,
  Users,
  Sparkles,
  ArrowRight,
  Target,
  Bell,
  Shield,
  Briefcase,
  Coins,
  Rocket,
} from 'lucide-react';
import SkyToggle from '@/components/ui/sky-toggle';
import { Banner } from '@/components/ui/banner';
import { BGPattern } from '@/components/ui/bg-pattern';
import { StaggerTestimonials } from '@/components/ui/stagger-testimonials';
import { LogosCarousel } from '@/components/blocks/logos-carousel';
import GlobeFeatureSection from '@/components/blocks/globe-feature-section';
import { AnimatedFooter } from '@/components/blocks/animated-footer';
import BentoGridDemo from '@/components/blocks/bento-grid-demo';
import AppleCardsCarouselDemo from '@/components/blocks/apple-cards-carousel-demo';
import { ShootingStars } from '@/components/ui/shooting-stars';
import { StarsBackground } from '@/components/ui/stars-background';

const features = [
  {
    icon: Target,
    title: 'Scholarship Radar',
    description: 'AI-powered matching finds scholarships you actually qualify for with personalized match scores.',
  },
  {
    icon: Sparkles,
    title: 'Why Not Me? Analyzer',
    description: 'Discover near-miss scholarships and get actionable steps to become eligible.',
  },
  {
    icon: FileText,
    title: 'Document Vault',
    description: 'Upload once, auto-fill everywhere. OCR extracts data from your documents automatically.',
  },
  {
    icon: Receipt,
    title: 'Fee Anomaly Detector',
    description: 'Compare your fees against official structures to catch discrepancies instantly.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Never miss a deadline with personalized alerts for scholarships and applications.',
  },
  {
    icon: Users,
    title: 'Community Intelligence',
    description: 'Learn from successful applicants and share insights with fellow students.',
  },
  {
    icon: Coins,
    title: 'Micro-Fellowships',
    description: 'Earn money by solving real business challenges. Get paid while building your portfolio.',
  },
];

const stats = [
  { value: '10,000+', label: 'Scholarships Tracked' },
  { value: '₹500Cr+', label: 'In Available Funding' },
  { value: '50,000+', label: 'Students Helped' },
  { value: '95%', label: 'Match Accuracy' },
];

export default function Home() {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-[#0a0a12] dark:to-[#0d0d18]">
      {/* Announcement Banner */}
      <Banner
        show={showBanner}
        onHide={() => setShowBanner(false)}
        variant="teal"
        title="🎉 New: Micro-Fellowships launched! Earn while you learn."
        description="Solve real business challenges and get paid"
        showShade={true}
        closable={true}
        icon={<Rocket className="h-4 w-4" />}
        className="fixed top-0 left-0 right-0 z-[60] rounded-none border-x-0 border-t-0"
        action={
          <Link href="/fellowships">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-teal-900 hover:text-teal-950 hover:bg-teal-100 dark:text-teal-100 dark:hover:bg-teal-800/50"
            >
              Explore
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        }
      />

      {/* Navigation */}
      <nav className={`fixed ${showBanner ? 'top-10' : 'top-0'} z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-teal-900/30 dark:bg-[#0a0a12]/90 transition-all duration-300`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">ScholarSync</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-teal-400 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-teal-400 transition-colors">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-teal-400 transition-colors">
              Testimonials
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <SkyToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative overflow-hidden ${showBanner ? 'pt-36' : 'pt-32'} pb-20 sm:pt-40 sm:pb-32 transition-all duration-300`}>
        {/* Background Pattern */}
        <BGPattern
          variant="dots"
          mask="fade-edges"
          size={32}
          fill="hsl(var(--muted-foreground) / 0.15)"
          className="opacity-50"
        />

        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-50 via-transparent to-emerald-50 dark:from-teal-950/20 dark:via-transparent dark:to-emerald-950/20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-teal-400/20 to-transparent blur-3xl dark:from-teal-500/10" />
          <div className="absolute top-20 right-1/4 h-[300px] w-[300px] rounded-full bg-gradient-to-b from-emerald-400/15 to-transparent blur-3xl dark:from-emerald-500/10" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm text-teal-700 dark:border-teal-800/50 dark:bg-teal-950/50 dark:text-teal-300">
              <Sparkles className="h-4 w-4" />
              Powered by AI - Trusted by 50,000+ Students
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              Your Smart
              <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent"> Scholarship </span>
              and Fee Tracker
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
              Stop missing scholarships you deserve. ScholarSync uses AI to match you with opportunities,
              auto-fill applications, and detect fee anomalies - all in one place.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600">
                  Find Scholarships
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/fellowships">
                <Button size="lg" variant="outline" className="gap-2 group border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50">
                  <Briefcase className="h-4 w-4" />
                  Earn via Fellowships
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
        <LogosCarousel heading="Trusted by students from top universities" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Everything You Need to Secure Funding
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              From discovery to application, ScholarSync streamlines your entire scholarship journey.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/10 dark:border-slate-800/50 dark:bg-[#111118] dark:hover:border-teal-700/50 dark:hover:shadow-teal-500/5"
              >
                <div className="mb-4 inline-flex rounded-xl bg-teal-100 p-3 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative bg-slate-50 py-20 sm:py-32 dark:bg-[#0d0d14] overflow-hidden">
        <BGPattern
          variant="grid"
          mask="fade-center"
          size={48}
          fill="hsl(var(--muted-foreground) / 0.08)"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Get Started in 3 Simple Steps
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="relative">
              <div className="text-6xl font-bold text-teal-100 dark:text-teal-900/50">01</div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Create Your Profile</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Tell us about your education, income, location, and goals. We handle the rest.</p>
            </div>
            <div className="relative">
              <div className="text-6xl font-bold text-teal-100 dark:text-teal-900/50">02</div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Upload Documents</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Add your certificates, income proofs, and ID cards. Our OCR extracts all details.</p>
            </div>
            <div className="relative">
              <div className="text-6xl font-bold text-teal-100 dark:text-teal-900/50">03</div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Get Matched</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Receive personalized scholarship matches with eligibility scores and deadline alerts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Showcase */}
      <section className="py-20 sm:py-32 bg-slate-50/50 dark:bg-[#0a0a12]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Powerful Features at a Glance
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Everything you need to discover, apply, and secure funding for your education.
            </p>
          </div>
          <BentoGridDemo />
        </div>
      </section>

      {/* Success Stories Carousel */}
      <section className="py-10 sm:py-16 overflow-hidden">
        <AppleCardsCarouselDemo />
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Students Love ScholarSync
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              See what students from top universities have to say about their experience.
            </p>
          </div>

          <StaggerTestimonials />
        </div>
      </section>

      {/* Globe Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GlobeFeatureSection />
        </div>
      </section>

      {/* CTA Section with Stars */}
      <section className="relative bg-gradient-to-r from-teal-600 to-emerald-600 py-20 dark:from-slate-900 dark:to-slate-900 overflow-hidden">
        {/* Stars background - only visible in dark mode */}
        <div className="absolute inset-0 dark:block hidden">
          <StarsBackground starDensity={0.0003} />
          <ShootingStars starColor="#14b8a6" trailColor="#10b981" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Find Your Scholarships?
            </h2>
            <p className="mt-4 text-lg text-teal-100 dark:text-slate-300">
              Join 50,000+ students who are already using ScholarSync to fund their education.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="gap-2 bg-white text-teal-700 hover:bg-teal-50 dark:bg-teal-500 dark:text-white dark:hover:bg-teal-600">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Footer */}
      <AnimatedFooter />
    </div>
  );
}
