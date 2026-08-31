import Link from "next/link";
import { MessageCircle, Heart, Compass, TrendingUp, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing/landing-nav";

const pillars = [
  {
    id: "talk",
    icon: MessageCircle,
    title: "Talk",
    description:
      "Talk freely, the way you would with a thoughtful friend. Buddy listens, reflects back what it hears, and asks the follow-up question that actually matters.",
  },
  {
    id: "remember",
    icon: Heart,
    title: "Remember",
    description:
      "You control what HelloBuddy remembers. Approved context — your goals, values, and important details — carries forward so conversations build on each other instead of starting from zero.",
  },
  {
    id: "reflect",
    icon: TrendingUp,
    title: "Reflect",
    description:
      "See your moods, themes, and goals in one dashboard. HelloBuddy surfaces possible patterns — never certainties — so you can decide what's true for you.",
  },
  {
    id: "grow",
    icon: Compass,
    title: "Grow",
    description:
      "Set goals that matter to you, and let Buddy check in on them honestly — including when you've quietly let them slide.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-clay-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 left-0 h-72 w-72 rounded-full bg-sage-100/60 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-500 shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-clay-500" /> Now welcoming early users
          </span>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-ink-900 sm:text-6xl">
            Your biggest supporter.
            <br />
            <span className="text-clay-500">Your honest mirror.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-600">
            HelloBuddy helps you reflect, remember what matters, stay connected to your goals, and
            think more clearly when life gets confusing.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Your Journey <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">I already have an account</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-400">Not therapy. Not a diagnostic tool. A companion for honest reflection.</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.id} id={p.id} className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay-50 text-clay-500">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-ink-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample conversation */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">A conversation with Buddy</p>
          <div className="mt-5 space-y-4">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-ink-900 px-4 py-3 text-sm text-white">
              I keep saying I want to get fit but I skipped the gym again.
            </div>
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-cream-100 px-4 py-3 text-sm text-ink-800">
              Based on what you've told me, fitness does seem important to you. But let's be honest:
              your current approach isn't producing the consistency you want. That doesn't mean
              you've failed — it means something in the system isn't working yet. What usually
              happens right before you decide not to go?
            </div>
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-4xl px-6 py-4">
        <div className="flex items-start gap-3 rounded-xl2 border border-ink-100 bg-white p-5 text-sm text-ink-500 shadow-soft">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sage-500" />
          <p>
            HelloBuddy is a personal reflection tool, not therapy, a medical service, or an
            emergency resource. If you're in crisis, please contact local emergency services or a
            crisis line immediately.
          </p>
        </div>
      </section>

      {/* Beta */}
      <section id="beta" className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="font-serif text-3xl font-semibold text-ink-900">Join the early HelloBuddy journey.</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-600">
          The first version is being built with a small group of early users. Your feedback will
          directly shape what HelloBuddy becomes.
        </p>
        <div className="mt-8">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Your Journey <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-100 py-8 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} HelloBuddy. A reflection companion — not a substitute for
        professional care.
      </footer>
    </div>
  );
}
