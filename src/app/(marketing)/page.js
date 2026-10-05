import { Boxes, ChartColumn, Palette, Receipt, Store, Users } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta";
import {
  BrandVisual,
  ReceiptVisual,
  ReportsVisual,
  StaffVisual,
  StockVisual,
  StoresVisual,
} from "@/components/marketing/mockups";
import { Reveal } from "@/components/marketing/reveal";

export const metadata = {
  title: "Koetap: a proper POS for your store",
  description:
    "Build and manage a complete point-of-sale system for your business in minutes. Multiple stores, inventory, staff, reports and receipts. No technical skills needed.",
};

const STEPS = [
  ["01", "Create your store", "Set up your POS in minutes with your name, logo and products."],
  ["02", "Add your team", "Create cashier accounts and assign them to your store."],
  ["03", "Start selling", "Your cashiers log in and start processing sales immediately."],
];

function SectionTag({ children, invert = false }) {
  return (
    <span className={`inline-block rounded-full border-2 px-4 py-1 text-sm font-bold ${invert ? "border-background" : "border-foreground"}`}>{children}</span>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-x-clip">
        {/* One soft warm glow behind the product: the only colour on the page */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[38%] -z-10 mx-auto h-[620px] max-w-5xl opacity-60 blur-3xl dark:opacity-30">
          <div className="mk-drift-a absolute top-0 left-[4%] size-[420px] rounded-full bg-[#ffb48a]" />
          <div className="mk-drift-b absolute top-24 right-[6%] size-[400px] rounded-full bg-[#ff8fb1]" />
          <div className="mk-drift-c absolute bottom-0 left-[34%] size-[380px] rounded-full bg-[#ffe08a]" />
        </div>

        <div className="mx-auto max-w-7xl px-5 pt-14 sm:px-8 sm:pt-20 lg:pt-24">
          <h1 className="text-[clamp(3.4rem,9.6vw,8.75rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
            {/* Each line slides up out of its own mask; the padding below keeps descenders from being cut off */}
            <span className="-mx-[0.3em] -mt-[0.08em] -mb-[0.24em] block overflow-hidden px-[0.3em] pt-[0.08em] pb-[0.24em]">
              <span className="mk-line" style={{ "--d": "0ms" }}>Your store</span>
            </span>
            <span className="-mx-[0.3em] -mt-[0.08em] -mb-[0.24em] block overflow-hidden px-[0.3em] pt-[0.08em] pb-[0.24em]">
              <span className="mk-line" style={{ "--d": "120ms" }}>deserves a</span>
            </span>
            <span className="-mx-[0.3em] -mt-[0.08em] -mb-[0.24em] block overflow-hidden px-[0.3em] pt-[0.08em] pb-[0.24em]">
              <span className="mk-line" style={{ "--d": "240ms" }}>
                <span className="mk-stamp relative inline-block rounded-[0.18em] bg-foreground px-[0.14em] pb-[0.06em] text-background">proper</span>{" "}
                POS.
              </span>
            </span>
          </h1>

          <div className="mt-10 flex flex-col gap-8 pb-24 sm:mt-14 sm:pb-32 lg:flex-row lg:items-end lg:justify-between">
            <p style={{ "--d": "900ms" }} className="mk-rise max-w-xl text-xl leading-snug font-medium text-muted-foreground sm:text-2xl">
              Koetap lets you build and manage a complete point-of-sale system for your business, in minutes. No technical skills needed.
            </p>
            <div style={{ "--d": "1050ms" }} className="mk-rise flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/register">Get Started</CtaLink>
              <CtaLink href="/how-it-works" variant="outline">See How It Works</CtaLink>
            </div>
          </div>


        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <SectionTag>What you get</SectionTag>
          <h2 className="mt-6 max-w-4xl text-5xl leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-7xl lg:text-8xl">Everything your business needs.</h2>
          <p className="mt-6 text-xl font-medium text-muted-foreground sm:text-2xl">One platform. Multiple stores. Total control.</p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:mt-20 sm:gap-5 md:grid-cols-2 lg:grid-cols-6">
          <Reveal className="group/f flex flex-col justify-between gap-10 overflow-hidden rounded-3xl bg-foreground p-7 text-background transition-transform duration-300 mk-tile hover:-translate-y-1.5 sm:p-10 lg:col-span-4">
            <div>
              <Store className="mk-icon size-10" strokeWidth={2} />
              <h3 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">Multiple Stores</h3>
              <p className="mt-3 max-w-md text-lg text-background/70">Create and manage multiple POS systems from one account. Perfect for growing businesses.</p>
            </div>
            <StoresVisual />
          </Reveal>

          <Reveal delay={80} className="flex flex-col justify-between gap-10 rounded-3xl border-2 border-foreground p-7 transition-transform duration-300 mk-tile hover:-translate-y-1.5 sm:p-10 lg:col-span-2">
            <div>
              <Boxes className="mk-icon size-10" strokeWidth={2} />
              <h3 className="mt-6 text-3xl font-extrabold tracking-tight">Inventory Tracking</h3>
              <p className="mt-3 text-lg text-muted-foreground">Never run out of stock unexpectedly. Get alerts when products are running low.</p>
            </div>
            <StockVisual />
          </Reveal>

          <Reveal className="flex flex-col justify-between gap-10 rounded-3xl border-2 border-foreground p-7 transition-transform duration-300 mk-tile hover:-translate-y-1.5 sm:p-9 lg:col-span-2">
            <div>
              <Users className="mk-icon size-10" strokeWidth={2} />
              <h3 className="mt-6 text-3xl font-extrabold tracking-tight">Staff Management</h3>
              <p className="mt-3 text-lg text-muted-foreground">Add cashiers, control their access, and track who sold what, all from your dashboard.</p>
            </div>
            <StaffVisual />
          </Reveal>

          <Reveal delay={80} className="flex flex-col justify-between gap-10 rounded-3xl border-2 border-foreground p-7 transition-transform duration-300 mk-tile hover:-translate-y-1.5 sm:p-9 lg:col-span-2">
            <div>
              <ChartColumn className="mk-icon size-10" strokeWidth={2} />
              <h3 className="mt-6 text-3xl font-extrabold tracking-tight">Sales Reports</h3>
              <p className="mt-3 text-lg text-muted-foreground">See your revenue, top products, and cashier performance at a glance.</p>
            </div>
            <ReportsVisual />
          </Reveal>

          <Reveal delay={160} className="flex flex-col justify-between gap-10 overflow-hidden rounded-3xl border-2 border-foreground p-7 transition-transform duration-300 mk-tile hover:-translate-y-1.5 sm:p-9 md:col-span-2 lg:col-span-2">
            <div>
              <Receipt className="mk-icon size-10" strokeWidth={2} />
              <h3 className="mt-6 text-3xl font-extrabold tracking-tight">Instant Receipts</h3>
              <p className="mt-3 text-lg text-muted-foreground">Print or email receipts to customers instantly after every sale.</p>
            </div>
            <ReceiptVisual />
          </Reveal>

          <Reveal className="flex flex-col justify-between gap-10 rounded-3xl bg-foreground p-7 text-background transition-transform duration-300 mk-tile hover:-translate-y-1.5 sm:p-10 md:col-span-2 lg:col-span-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <Palette className="mk-icon size-10" strokeWidth={2} />
              <h3 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">Your Brand</h3>
              <p className="mt-3 text-lg text-background/70">Add your logo and brand colour. Your POS looks like yours, not ours.</p>
            </div>
            <BrandVisual />
          </Reveal>
        </div>
      </section>

      {/* ---------- How it works teaser ---------- */}
      <section className="border-y-2 border-foreground">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-3xl text-5xl leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-7xl lg:text-8xl">Three steps. Then you&apos;re selling.</h2>
            <CtaLink href="/how-it-works" variant="outline" className="shrink-0">The full walkthrough</CtaLink>
          </Reveal>

          <Reveal as="ol" className="relative mt-16 grid gap-14 sm:mt-24 lg:grid-cols-3 lg:gap-10">
            <div aria-hidden="true" className="mk-grow-x absolute top-[3.2rem] right-[16%] left-[8%] hidden h-0.5 bg-foreground lg:block" style={{ "--i": 2 }} />
            {STEPS.map(([n, h, d], i) => (
              <Reveal as="li" key={n} delay={i * 120} className="relative">
                <span className="mk-outline relative block bg-background pr-4 text-[8rem] leading-[0.85] font-extrabold tracking-tighter sm:text-[10rem] lg:inline-block">{n}</span>
                <h3 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">{h}</h3>
                <p className="mt-3 max-w-sm text-lg text-muted-foreground">{d}</p>
              </Reveal>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ---------- Final call to action ---------- */}
      <section className="mk-grid relative overflow-hidden bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 sm:py-40">
          <Reveal>
            <h2 className="text-[clamp(3.25rem,10vw,9rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
              Ready to
              <br />
              build your POS?
            </h2>
            <p className="mt-8 max-w-xl text-xl font-medium text-background/70 sm:text-2xl">
              Set up your store in minutes, add your products and your team, and start selling today.
            </p>
            <div className="mt-10">
              <CtaLink href="/register" variant="invert">Create Your Store</CtaLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
