import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const tips = [
  {
    title: "Hidden rooftop cafes for slow mornings",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Weekend escapes that feel far away",
    image:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Local markets with unforgettable flavors",
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Walkable neighborhoods for night owls",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function TravelTipsSection() {
  return (
    <section id="travel-tips" className="scroll-mt-24">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Travel tips & adventure advice
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-foreground">
              Fresh ideas for your next stay
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A curated stream of travel notes and local guides. Soon this will link
              to full blog stories and reviews.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Coming soon
          </span>
        </div>

        <div className="mt-10 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {tips.map((tip, index) => (
            <motion.article
              key={tip.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="min-w-[280px] max-w-[320px] flex-1 snap-start rounded-2xl border border-border bg-surface shadow-sm"
            >
              <div className="relative h-44 overflow-hidden rounded-t-2xl">
                <img
                  src={tip.image}
                  alt={tip.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground">{tip.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Short insight teaser to be replaced by blog content.
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
