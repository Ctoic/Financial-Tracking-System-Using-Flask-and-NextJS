import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export default function HeroSection() {
  const handleScroll = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1800&q=80"
          alt="Welcoming hostel lobby"
          className="h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/50" />
        <div className="absolute inset-0 bg-neutral-900/50 mix-blend-multiply" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="flex flex-col gap-10 pb-20 pt-24 md:pb-28 md:pt-32 lg:flex-row lg:items-center lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl text-white"
          >
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Stay in a hostel built for comfort, care, and community.
            </h1>
            <p className="mt-6 text-lg text-white/80 md:text-xl">
              A calm, professional environment that blends modern amenities with warm
              hospitality. Everything you need to feel settled from day one.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                onClick={() => handleScroll("registration")}
                className="h-12 px-8 bg-white text-black hover:bg-white/90"
              >
                Apply for accommodation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
