import React from "react";

const images = [
  {
    src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    alt: "Modern hostel room with natural light",
  },
  {
    src: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80",
    alt: "Cozy shared dorm space",
  },
  {
    src: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
    alt: "Minimalist hostel bedroom",
  },
  {
    src: "https://images.unsplash.com/photo-1505691723518-13f1cbbf4f56?auto=format&fit=crop&w=1200&q=80",
    alt: "Reception area with warm lighting",
  },
  {
    src: "https://images.unsplash.com/photo-1489171078254-c3365d6e359f?auto=format&fit=crop&w=1200&q=80",
    alt: "Shared lounge seating",
  },
  {
    src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
    alt: "Clean hostel room interior",
  },
  {
    src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    alt: "Lounge seating with modern decor",
  },
];

const sliderRows = [
  { id: "row-1", speed: "26s", reverse: false },
  { id: "row-2", speed: "32s", reverse: true },
];

export default function HostelImageSlider() {
  return (
    <section id="spaces" className="scroll-mt-24 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Spaces</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-foreground">
              A feel for the rooms, before you arrive
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Bright, comfortable, and designed for calm. Browse a live stream of our
              latest hostel interiors and shared spaces.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Auto-scrolling gallery</p>
        </div>

        <div className="mt-10 space-y-6">
          {sliderRows.map((row) => {
            const slides = [...images, ...images];
            return (
              <div
                key={row.id}
                className="slider-shell relative overflow-hidden rounded-2xl border border-border bg-surface"
                style={{ "--duration": row.speed } as React.CSSProperties}
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
                <div className={`slider-track ${row.reverse ? "reverse" : ""}`}>
                  {slides.map((image, index) => (
                    <div
                      key={`${image.src}-${index}`}
                      className="slide"
                      aria-hidden={index >= images.length}
                    >
                      <img src={image.src} alt={image.alt} loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .slider-shell {
          padding: 16px 0;
        }

        .slider-track {
          display: flex;
          gap: 20px;
          width: max-content;
          animation: marquee var(--duration) linear infinite;
        }

        .slider-track.reverse {
          animation-direction: reverse;
        }

        .slide {
          width: 320px;
          height: 200px;
          flex: 0 0 auto;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--surface-muted);
        }

        .slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 1024px) {
          .slide {
            width: 260px;
            height: 170px;
          }
        }

        @media (max-width: 640px) {
          .slide {
            width: 220px;
            height: 150px;
          }
        }
      `}</style>
    </section>
  );
}
