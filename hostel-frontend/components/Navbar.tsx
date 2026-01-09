import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navItems = [
  { id: "home", label: "Home" },
  { id: "spaces", label: "Spaces" },
  { id: "features", label: "Features" },
  { id: "amenities", label: "Amenities" },
  { id: "registration", label: "Apply" },
  { id: "stats", label: "Stats" },
  { id: "testimonials", label: "Stories" },
  { id: "travel-tips", label: "Tips" },
];

export default function Navbar() {
  const [activeId, setActiveId] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.2 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const navClass = useMemo(() => {
    return `fixed top-0 z-50 w-full transition-all duration-300 ${
      isScrolled
        ? "bg-black/70 backdrop-blur-lg"
        : "bg-transparent"
    }`;
  }, [isScrolled]);

  const linkClass = (id: string) =>
    `px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em] transition-colors ${
      activeId === id
        ? "bg-white/15 text-white border border-white/30"
        : "text-white/70 hover:text-white hover:bg-white/10"
    }`;

  const handleAnchorClick = (id: string) => {
    setIsOpen(false);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className={navClass}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button
          type="button"
          onClick={() => handleAnchorClick("home")}
          className="flex items-center gap-2 text-white"
        >
          <span className="text-lg font-semibold lowercase tracking-[0.12em]">roomigo</span>
        </button>

        <div className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleAnchorClick(item.id)}
              className={linkClass(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full border border-white/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white hover:text-black lg:inline-flex"
          >
            Admin Login
          </Link>
          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-white/10 bg-black/90 px-4 py-6 lg:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAnchorClick(item.id)}
                className={`text-left text-sm font-semibold uppercase tracking-[0.25em] ${
                  activeId === item.id ? "text-white" : "text-white/70"
                }`}
              >
                {item.label}
              </button>
            ))}
            <Link
              href="/login"
              className="mt-4 inline-flex w-fit rounded-full border border-white/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-white hover:text-black"
            >
              Admin Login
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
