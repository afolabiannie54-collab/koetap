import { CtaLink } from "@/components/marketing/cta";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Reveal } from "@/components/marketing/reveal";

export const metadata = {
  title: "Questions about Koetap",
  description: "Everything you need to know about Koetap: stores, cashiers, payments, receipts and your data.",
};

const FAQ = [
  {
    q: "What is Koetap?",
    a: "Koetap is a platform that lets you create and manage a complete point-of-sale system for your business. Think of it as a POS builder: you set it up once and your team can start selling immediately.",
  },
  {
    q: "Do I need to download anything?",
    a: "No. Koetap runs entirely in your web browser. Your cashiers can use it on any device, desktop, tablet, or phone, without installing anything.",
  },
  {
    q: "How many stores can I create?",
    a: "You can create as many stores as you need from one account. Each store is completely independent with its own products, staff, and sales data.",
  },
  {
    q: "Can my cashiers see my sales reports or business data?",
    a: "No. Cashiers only see the POS screen for their assigned store. They cannot access reports, products, settings, or any other part of your dashboard.",
  },
  {
    q: "What payment methods does Koetap support?",
    a: "Koetap records sales paid by cash, bank transfer, or any other method. Your cashier selects how the customer paid and it's logged automatically.",
  },
  {
    q: "Does Koetap process payments for me?",
    a: "No. Koetap is a POS management system, not a payment processor. Your customers pay you directly (cash, transfer, POS machine) and your cashier records the sale in Koetap.",
  },
  {
    q: "Can I print receipts?",
    a: "Yes. After every sale you can print a receipt directly from the browser or send it to the customer's email address.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. All your data is securely stored and only accessible by you and your authorised staff.",
  },
  {
    q: "What if I have more questions?",
    a: "Send us a message at support@koetap.com and we'll get back to you as soon as possible.",
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-16 pb-14 sm:px-8 sm:pt-24 sm:pb-20">
        <h1 className="animate-contentIn text-[clamp(3.2rem,9.5vw,8.5rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
          Questions,
          <br />
          answered.
        </h1>
        <p className="mt-8 max-w-xl text-xl font-medium text-muted-foreground sm:text-2xl">Everything you need to know about Koetap.</p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        <FaqAccordion items={FAQ} />
      </section>

      <section className="mk-grid bg-foreground text-background">
        <Reveal className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
          <h2 className="max-w-4xl text-5xl leading-[0.92] font-extrabold tracking-[-0.05em] sm:text-8xl">Still have questions? We&apos;re happy to help.</h2>
          <a href="mailto:support@koetap.com" className="mt-8 inline-block text-2xl font-bold underline decoration-2 underline-offset-8 sm:text-4xl">
            support@koetap.com
          </a>
          <div className="mt-10">
            <CtaLink href="/register" variant="invert">Get Started</CtaLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
