import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const stories = [
  {
    name: "Ayesha Khan",
    role: "Final year student",
    stay: "Stayed 10 months",
    rating: 4.9,
    highlight: "Food quality",
    comment:
      "Meals are consistent and the kitchen team keeps the menu fresh. Timings are clear and staff are always helpful when exams run late.",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Rohan Gupta",
    role: "Engineering intern",
    stay: "Stayed 6 months",
    rating: 4.7,
    highlight: "Comfort & care",
    comment:
      "Rooms are clean, quiet, and the common areas feel safe even after long shifts. Laundry and cleaning schedules are reliable.",
    image:
      "https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Fatima Noor",
    role: "MBA candidate",
    stay: "Stayed 1 year",
    rating: 5.0,
    highlight: "Community vibe",
    comment:
      "The staff knows everyone by name. Weekly check-ins and the notice board updates make the hostel feel like a real community.",
    image:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=300&q=80",
  },
  {
    name: "Arjun Mehta",
    role: "Postgrad researcher",
    stay: "Stayed 8 months",
    rating: 4.8,
    highlight: "Quiet spaces",
    comment:
      "Study zones stay quiet, and the room assignments keep noise levels low. The admin team responds quickly to requests.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
];

const toShortComment = (comment: string, limit = 130) => {
  if (comment.length <= limit) return comment;
  return `${comment.slice(0, limit).trim()}...`;
};

export default function CustomerStoriesSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSummary = useMemo(() => {
    const selected = stories[activeIndex] ?? stories[0];
    return selected ? `${selected.highlight} highlighted` : "Stories highlighted";
  }, [activeIndex]);

  return (
    <section id="testimonials" className="scroll-mt-24 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Customer stories
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-foreground">
              What residents say about staying here
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Tap a story to expand the full feedback, ratings, and details.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {activeSummary}
          </span>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stories.map((story, index) => {
            const isActive = index === activeIndex;
            const fullStars = Math.round(story.rating);
            const comment = isActive ? story.comment : toShortComment(story.comment);
            return (
              <motion.button
                key={story.name}
                type="button"
                onClick={() => setActiveIndex(index)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="text-left"
                aria-pressed={isActive}
              >
                <Card
                  className={`h-full transition ${
                    isActive ? "border-foreground shadow-soft" : "border-border"
                  }`}
                >
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 overflow-hidden rounded-full border border-border">
                        <img
                          src={story.image}
                          alt={`${story.name} portrait`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{story.name}</p>
                        <p className="text-xs text-muted-foreground">{story.role}</p>
                      </div>
                      <span className="ml-auto text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        {story.stay}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star
                            key={`${story.name}-star-${starIndex}`}
                            className={`h-4 w-4 ${
                              starIndex < fullStars
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                            strokeWidth={1.5}
                            fill={starIndex < fullStars ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{story.rating.toFixed(1)}</span>
                    </div>

                    <p className="text-sm text-foreground">{comment}</p>

                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                      <span>{story.highlight}</span>
                      <span>{isActive ? "Expanded" : "Tap to expand"}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
