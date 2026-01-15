import React from "react";

const amenities = [
  {
    title: "High-speed Wi-Fi",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Quality meals three times daily",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Carpeted, clean rooms with attached bathrooms",
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Clean drinking water",
    image:
      "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Hot and cold showers 24/7",
    image:
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Electricity 24/7",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Clean, shared kitchen",
    image:
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Professional staff",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Scholarships for the needy",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Disturbance-free, career counseling",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function HostelAmenitiesSection() {
  const slides = [...amenities, ...amenities];
  const sliderRows = [
    { id: "amenities-row-1", duration: "28s", reverse: false },
    { id: "amenities-row-2", duration: "34s", reverse: true },
  ];

  return (
    <section id="amenities" className="scroll-mt-24 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Hostel facilities
            </p>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-foreground">
              Facilities that make every day easier
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Clean, safe, and reliable essentials that residents notice from day one.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Auto-scrolling gallery
          </span>
        </div>

        <div className="relative mt-10 space-y-6">
          {sliderRows.map((row) => (
            <div
              key={row.id}
              className="slider-shell relative overflow-hidden rounded-3xl border border-border bg-surface"
              style={{ "--duration": row.duration } as React.CSSProperties}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
              <div className={`slider-track ${row.reverse ? "reverse" : ""}`}>
                {slides.map((amenity, index) => (
                  <article key={`${amenity.title}-${index}`} className="amenity-card">
                    <div className="card-media">
                      <img src={amenity.image} alt={amenity.title} loading="lazy" />
                      <div className="card-overlay" />
                    </div>
                    <div className="card-body">
                      <p className="card-label">Facility</p>
                      <h3>{amenity.title}</h3>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
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
          animation: amenity-marquee var(--duration) linear infinite;
        }

        .slider-track.reverse {
          animation-direction: reverse;
        }

        .amenity-card {
          position: relative;
          width: 320px;
          flex: 0 0 auto;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--surface);
          box-shadow: 0 16px 35px -28px rgba(0, 0, 0, 0.45);
        }

        .card-media {
          position: relative;
          height: 190px;
        }

        .card-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.78));
        }

        .card-body {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 18px;
          color: #ffffff;
        }

        .card-body h3 {
          margin: 8px 0 0;
          font-size: 1.05rem;
          font-weight: 600;
        }

        .card-label {
          margin: 0;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          opacity: 0.7;
        }

        @keyframes amenity-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 1024px) {
          .amenity-card {
            width: 280px;
          }
        }

        @media (max-width: 640px) {
          .amenity-card {
            width: 240px;
          }
        }
      `}</style>
    </section>
  );
}
