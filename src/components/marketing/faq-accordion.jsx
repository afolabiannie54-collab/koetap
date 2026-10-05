"use client";

import { Accordion as AccordionPrimitive } from "radix-ui";
import { Plus } from "lucide-react";

// Each question is a row; opening one slides the answer down. One open at a time.
export function FaqAccordion({ items }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="border-t-2 border-foreground">
      {items.map((item, i) => (
        <AccordionPrimitive.Item key={item.q} value={`q${i}`} style={{ animationDelay: `${300 + i * 70}ms` }} className="animate-contentIn border-b-2 border-foreground">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group/q flex w-full items-center gap-4 py-6 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:gap-8 sm:py-8">
              <span className="w-8 shrink-0 text-sm font-bold tabular-nums text-muted-foreground sm:w-12 sm:text-base">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 text-xl font-bold tracking-tight sm:text-3xl">{item.q}</span>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground transition-all duration-300 group-hover/q:bg-foreground group-hover/q:text-background group-data-[state=open]/q:rotate-45 group-data-[state=open]/q:bg-foreground group-data-[state=open]/q:text-background">
                <Plus className="size-5" strokeWidth={2.5} />
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="mk-acc overflow-hidden">
            <p className="max-w-3xl pb-8 pl-12 text-lg leading-relaxed text-muted-foreground sm:pl-20 sm:text-xl">{item.a}</p>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
