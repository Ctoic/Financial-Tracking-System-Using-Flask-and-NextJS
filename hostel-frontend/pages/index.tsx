import { useEffect, useMemo, useState } from "react";
import { useRouter } from 'next/router';
import { motion } from "framer-motion";
import { Building2, Clock, FileText, Utensils } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import HostelRegistrationForm from "../components/HostelRegistrationForm";
import HostelImageSlider from "../components/HostelImageSlider";
import HeroSection from "../components/HeroSection";
import Navbar from "../components/Navbar";
import TravelTipsSection from "../components/TravelTipsSection";
import HostelAmenitiesSection from "../components/HostelAmenitiesSection";
import CustomerStoriesSection from "../components/CustomerStoriesSection";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5051";
const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const baseMealTypes = ["Breakfast", "Lunch", "Dinner"];

interface MealTiming {
  meal_name: string;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
}

interface MealMenuItem {
  day_of_week: number;
  meal_name: string;
  menu_items?: string | null;
}

const toMondayIndex = (dayIndex: number) => (dayIndex + 6) % 7;

const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (start && end) return `${start} - ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "Time to be announced";
};

const parseMenuItems = (value?: string | null) =>
  (value ?? "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

function SectionContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4">
      {children}
    </div>
  );
}

function MealScheduleSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timings, setTimings] = useState<MealTiming[]>([]);
  const [menu, setMenu] = useState<MealMenuItem[]>([]);
  const [activeDay, setActiveDay] = useState(() => toMondayIndex(new Date().getDay()));

  const mealTypes = useMemo(() => {
    const mealSet = new Set(baseMealTypes);
    timings.forEach((timing) => {
      const name = String(timing?.meal_name || "").trim();
      if (name) mealSet.add(name);
    });
    menu.forEach((item) => {
      const name = String(item?.meal_name || "").trim();
      if (name) mealSet.add(name);
    });
    return Array.from(mealSet);
  }, [timings, menu]);

  const menuByDay = useMemo(() => {
    const mapping: Record<number, Record<string, string>> = {};
    dayLabels.forEach((_label, idx) => {
      mapping[idx] = {};
    });
    menu.forEach((item) => {
      const day = Number(item?.day_of_week);
      const meal = String(item?.meal_name || "").trim();
      if (!Number.isFinite(day) || day < 0 || day > 6 || !meal) return;
      if (!mapping[day]) mapping[day] = {};
      mapping[day][meal] = String(item?.menu_items ?? "");
    });
    return mapping;
  }, [menu]);

  const activeMenu = menuByDay[activeDay] ?? {};
  const todayIndex = toMondayIndex(new Date().getDay());
  const activeDayHasMenu = mealTypes.some((meal) => (activeMenu?.[meal] ?? "").trim());

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchMeals = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/meals/public`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load meals");
        }
        const data = await response.json();
        if (!isMounted) return;
        setTimings(Array.isArray(data?.timings) ? data.timings : []);
        setMenu(Array.isArray(data?.menu) ? data.menu : []);
        setError(null);
      } catch (err: any) {
        if (!isMounted || err?.name === "AbortError") return;
        console.error("Failed to load meal schedule:", err);
        setError("Meal schedule updates are unavailable right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMeals();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const timingRows = timings.length
    ? timings
    : mealTypes.map((meal) => ({ meal_name: meal, start_time: "", end_time: "" }));

  return (
    <section id="meals" className="scroll-mt-24 py-16 md:py-24">
      <SectionContainer>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Dining schedule
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-foreground">
              Meal timings & weekly menu
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Plan ahead with clear serving hours and a day-by-day menu prepared by our kitchen team.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Updated weekly
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted">
                  <Clock className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Meal timings</CardTitle>
                  <CardDescription>Daily serving windows for each meal.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading meal timings...</p>
              ) : (
                <div className="space-y-4">
                  {timingRows.map((timing) => (
                    <div
                      key={timing.meal_name}
                      className="rounded-xl border border-border bg-surface-muted p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{timing.meal_name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatTimeRange(timing.start_time, timing.end_time)}
                          </p>
                          {timing.notes ? (
                            <p className="mt-2 text-xs text-muted-foreground">{timing.notes}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {error && !timings.length ? (
                <div className="rounded-xl border border-border bg-surface-muted p-4 text-sm text-muted-foreground">
                  {error}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="h-full lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted">
                  <Utensils className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Weekly menu</CardTitle>
                  <CardDescription>Browse each day and find today's meals fast.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {dayLabels.map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveDay(idx)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      activeDay === idx
                        ? "bg-foreground text-background"
                        : "bg-surface-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {dayLabels[activeDay]}
                  {activeDay === todayIndex ? " - Today" : ""}
                </span>
                <span>{activeDayHasMenu ? "Menu updated" : "Menu not posted yet"}</span>
              </div>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading menu...</p>
              ) : error && !menu.length ? (
                <div className="rounded-xl border border-border bg-surface-muted p-4 text-sm text-muted-foreground">
                  {error}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {mealTypes.map((meal) => {
                    const items = parseMenuItems(activeMenu?.[meal]);
                    return (
                      <div
                        key={meal}
                        className="rounded-xl border border-border bg-surface-muted p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-foreground">{meal}</h3>
                          <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                            Menu
                          </span>
                        </div>
                        {items.length ? (
                          <ul className="mt-3 space-y-1 text-sm text-foreground">
                            {items.map((item, idx) => (
                              <li key={`${meal}-${idx}`} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground opacity-60" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground">
                            Menu items will be shared soon.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SectionContainer>
    </section>
  );
}

function RegistrationSection() {
  return (
    <SectionContainer>
      <div id="registration" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-surface-muted">
                <FileText className="h-6 w-6 text-foreground" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Apply for Hostel Accommodation
            </h2>
            <p className="mt-4 text-muted-foreground">
              Ready to join our hostel community? Fill out the registration form below and we'll get back to you with availability and next steps.
            </p>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <HostelRegistrationForm />
        </motion.div>
      </div>
    </SectionContainer>
  );
}

function Stats() {
  const stats = [
    { label: "Active Students", value: "1,200+" },
    { label: "Rooms Managed", value: "450+" },
    { label: "Avg. Time Saved", value: "8h/week" },
    { label: "Uptime", value: "99.9%" },
  ];
  return (
    <section id="stats" className="scroll-mt-24">
      <SectionContainer>
        <div className="py-12">
          <Card>
            <CardContent className="py-10">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="space-y-1"
                  >
                    <div className="text-3xl font-bold text-foreground">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionContainer>
    </section>
  );
}

function CTA() {
  const router = useRouter();
  return (
    <SectionContainer>
      <div className="py-20">
        <Card className="bg-foreground text-background">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">Ready to streamline your hostel?</CardTitle>
            <CardDescription className="text-background/70">
              Get started in minutes. No credit card required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Button variant="secondary" onClick={() => router.push('/login')} className="h-11 px-8">
                Launch Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <HostelImageSlider />
      <HostelAmenitiesSection />
      <MealScheduleSection />
      <RegistrationSection />
      <Stats />
      <CustomerStoriesSection />
      <TravelTipsSection />
      <CTA />
      <footer className="py-10 border-t border-border">
        <SectionContainer>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Hostel Management System
            </div>
            <div className="flex items-center gap-6">
              <a className="hover:text-foreground" href="#">Privacy</a>
              <a className="hover:text-foreground" href="#">Terms</a>
              <a className="hover:text-foreground" href="#">Contact</a>
            </div>
            <div>© {new Date().getFullYear()} All rights reserved.</div>
          </div>
        </SectionContainer>
      </footer>
    </div>
  );
}
