import { useRouter } from 'next/router';
import { motion } from "framer-motion";
import { Building2, Users, KeySquare, ChartBar, Sparkles, ShieldCheck, Zap, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import HostelRegistrationForm from "../components/HostelRegistrationForm";

function SectionContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4">
      {children}
    </div>
  );
}

function Hero() {
  const router = useRouter();
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-muted/70 to-background" />
      <SectionContainer>
        <div className="relative pt-24 pb-20 md:pt-32 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="mb-4 inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              New: Smart occupancy & fee analytics
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Manage Your Hostel with Confidence
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground">
              All-in-one platform to handle students, rooms, and finances — simple, fast, and secure.
            </p>
            <div className="mt-8 flex items-center justify-center">
              <Button onClick={() => router.push('/login')} className="h-12 px-8">
                Get Started
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Secure</div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Fast setup</div>
              <div className="flex items-center gap-2"><ChartBar className="h-4 w-4" /> Real-time analytics</div>
            </div>
          </motion.div>
        </div>
      </SectionContainer>
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-foreground/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-foreground/10 blur-3xl" />
    </div>
  );
}

function Features() {
  const features = [
    {
      icon: <Users className="h-6 w-6 text-foreground" />,
      title: "Student Management",
      desc: "Maintain profiles, allocations, and payments with ease.",
    },
    {
      icon: <Building2 className="h-6 w-6 text-foreground" />,
      title: "Room Management",
      desc: "Track occupancy, maintenance, and availability in real time.",
    },
    {
      icon: <ChartBar className="h-6 w-6 text-foreground" />,
      title: "Financial Tracking",
      desc: "Monitor expenses, fee collections, and generate reports.",
    },
    {
      icon: <KeySquare className="h-6 w-6 text-foreground" />,
      title: "Access Control",
      desc: "Granular roles and permissions for staff members.",
    },
  ];
  return (
    <SectionContainer>
      <div className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Everything you need to run a modern hostel
          </h2>
          <p className="mt-4 text-muted-foreground">
            Streamlined tools to save time and reduce errors.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-surface-muted">
                    {f.icon}
                  </div>
                  <CardTitle className="mt-4">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

function RegistrationSection() {
  return (
    <SectionContainer>
      <div className="py-16 md:py-24">
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
  );
}

function Testimonials() {
  const items = [
    {
      quote: "The system reduced our manual work dramatically and improved accuracy.",
      name: "Anita Sharma",
      role: "Warden, Sunrise Hostels",
    },
    {
      quote: "Setup was quick and the analytics are invaluable for planning.",
      name: "Michael Ade",
      role: "Administrator, Greenfield Campus",
    },
    {
      quote: "Our finance tracking is finally organized and transparent.",
      name: "Kiran Patel",
      role: "Finance Lead, Metro Dorms",
    },
  ];
  return (
    <SectionContainer>
      <div className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Loved by hostel teams</h2>
          <p className="mt-3 text-muted-foreground">Real stories from operators who switched.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <p className="text-foreground">“{t.quote}”</p>
                  <div className="mt-6 text-sm text-muted-foreground">
                    <div className="font-semibold text-foreground">{t.name}</div>
                    <div>{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionContainer>
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
      <Hero />
      <Features />
      <RegistrationSection />
      <Stats />
      <Testimonials />
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
