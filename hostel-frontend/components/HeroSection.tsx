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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.3)_55%,rgba(0,0,0,0)_100%)]" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="flex flex-col gap-10 pb-20 pt-28 md:pb-28 md:pt-36 lg:pt-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl text-white"
          >
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Stay in a hostel built for comfort, care, and community.
            </h1>
            <p className="mt-6 text-lg font-medium text-white/90 md:text-xl">
              A calm, professional environment that blends modern amenities with warm
              hospitality. Everything you need to feel settled from day one.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                onClick={() => handleScroll("registration")}
                className="h-12 px-8 bg-white text-black hover:bg-white/90"
              >
                Apply for accommodation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => handleScroll("spaces")}
                className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80 underline underline-offset-4 transition hover:text-white"
              >
                Explore rooms
              </button>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={(event) => event.preventDefault()}
            className="mx-auto w-full max-w-4xl rounded-3xl border-2 border-white/80 bg-white p-4 text-black shadow-2xl"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:divide-x md:divide-black/15">
              <label className="flex flex-1 flex-col gap-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/70">
                  Location
                </span>
                <input
                  type="text"
                  placeholder="City or region"
                  className="w-full bg-transparent text-base font-semibold text-black placeholder:text-black/40 focus:outline-none"
                />
              </label>
              <label className="flex flex-1 flex-col gap-2 px-1 md:px-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/70">
                  Move-in
                </span>
                <input
                  type="date"
                  className="w-full bg-transparent text-base font-semibold text-black focus:outline-none"
                />
              </label>
              <label className="flex flex-1 flex-col gap-2 px-1 md:px-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/70">
                  Stay length
                </span>
                <select className="w-full bg-transparent text-base font-semibold text-black focus:outline-none">
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </label>
              <div className="md:px-4">
                <Button
                  type="submit"
                  className="h-12 w-full bg-black px-6 text-white hover:bg-black/90 md:w-auto"
                >
                  Search stays
                </Button>
              </div>
            </div>
          </motion.form>

        </div>
      </div>
    </section>
  );
}
