"use client";

import { motion } from "framer-motion";
import { ArrowRight, Activity, Map, Users, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background">
      <header className="px-6 lg:px-14 h-20 flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 sticky top-0">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Map className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tighter text-foreground">JourneyIQ</span>
        </Link>
        <nav className="ml-auto flex gap-6 sm:gap-8 items-center">
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block" href="#">
            Features
          </Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block" href="#">
            Solutions
          </Link>
          <ThemeToggle />
          <Link href="/dashboard" className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm">
            Launch Platform
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>
      
      <main className="flex-1 relative">
        <section className="w-full py-24 md:py-32 lg:py-48 flex justify-center">
          <div className="container px-4 md:px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center space-y-8 text-center"
            >
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
                <Sparkles className="mr-2 h-4 w-4" />
                Next-Gen Customer Intelligence for Financial Services
              </div>
              <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl max-w-4xl text-foreground">
                Unify Every Customer Journey
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed">
                Connect mobile, web, call center, branch, and ATM interactions into a single AI-powered intelligence platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90"
                >
                  Enter Executive Dashboard
                </Link>
                <Link
                  href="#"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background px-8 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
                >
                  Watch Demo
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Background decorative elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        </section>

        <section className="w-full py-20 bg-muted/30 border-t border-border flex justify-center z-10 relative">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="bg-primary/10 p-4 rounded-full">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Real-time Stitching</h3>
                <p className="text-muted-foreground">Instantly connect cross-channel events to build a unified 360° customer profile.</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="bg-primary/10 p-4 rounded-full">
                  <ShieldAlert className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Proactive Anomaly Detection</h3>
                <p className="text-muted-foreground">AI automatically identifies broken journeys and alerts you before churn happens.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="bg-primary/10 p-4 rounded-full">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Next Best Action</h3>
                <p className="text-muted-foreground">Empower support agents with AI-driven recommendations tailored to each customer.</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
