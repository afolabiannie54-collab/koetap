import { CtaLink } from "@/components/marketing/cta";
import { BrowserFrame, CashierMock, PosMock, RegisterMock, WizardMock } from "@/components/marketing/mockups";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "How Koetap works",
  description: "From sign up to your first sale in minutes: create your account, set up your store, add products, add cashiers and start selling.",
};

const STEPS = [
  {
    n: "1",
    title: "Create your account",
    text: "Sign up with your email or Google account. Tell us your business name and you're in.",
    visual: <RegisterMock />,
  },
  {
    n: "2",
    title: "Set up your store",
    text: "Use our setup wizard to add your store name, logo, and brand colour. This becomes your POS system.",
    visual: <WizardMock />,
  },
  {
    n: "3",
    title: "Add your products",
    text: "Add everything you sell: name, price, and stock quantity. Your POS grid is built from your products.",
    visual: (
      <BrowserFrame url="koetap.com/pos">
        <PosMock cart={false} />
      </BrowserFrame>
    ),
  },
  {
    n: "4",
    title: "Add your cashiers",
    text: "Create accounts for your staff. They log in and see only your store's POS, nothing else.",
    visual: <CashierMock />,
  },
  {
    n: "5",
    title: "Start selling",
    text: "Your cashiers tap products, complete sales, and print or email receipts. You watch the reports.",
    visual: (
      <BrowserFrame url="koetap.com/pos">
        <PosMock />
      </BrowserFrame>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-16 pb-8 sm:px-8 sm:pt-24">
        <h1 className="animate-contentIn text-[clamp(3.4rem,10vw,9rem)] leading-[0.9] font-extrabold tracking-[-0.055em]">
          How Koetap
          <br />
          works.
        </h1>
        <p className="mt-8 max-w-xl text-xl font-medium text-muted-foreground sm:text-2xl">From sign up to your first sale in minutes.</p>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        {STEPS.map((s, i) => {
          const flip = i % 2 === 1;
          return (
            <Reveal key={s.n} from={flip ? "right" : "left"} className="grid items-center gap-10 border-t-2 border-foreground py-16 sm:py-24 lg:grid-cols-2 lg:gap-20">
              <div className={cn(flip && "lg:order-2")}>
                <span className="mk-outline block text-[9rem] leading-[0.8] font-extrabold tracking-tighter sm:text-[13rem]">{s.n}</span>
                <h2 className="mt-6 text-4xl leading-[1] font-extrabold tracking-[-0.035em] sm:text-6xl">{s.title}</h2>
                <p className="mt-5 max-w-md text-xl leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
              <div className={cn("mx-auto w-full max-w-xl lg:max-w-none", flip && "lg:order-1")}>{s.visual}</div>
            </Reveal>
          );
        })}
      </section>

      <section className="mk-grid bg-foreground text-background">
        <Reveal className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
          <h2 className="max-w-4xl text-5xl leading-[0.92] font-extrabold tracking-[-0.05em] sm:text-8xl">Sounds good? Get started in minutes.</h2>
          <div className="mt-10">
            <CtaLink href="/register" variant="invert">Get Started</CtaLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
