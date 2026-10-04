"use client";

import { useSyncExternalStore } from "react";

// "Good morning, Anna" and today's date, worked out from the visitor's own clock (a server in another
// timezone would get the time of day wrong). Until the page is live it shows a neutral "Welcome back",
// so server and browser always agree on the first render.
const noSubscribe = () => () => {};
const hourNow = () => new Date().getHours();
const dateNow = () =>
  new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function Greeting({ name }) {
  const hour = useSyncExternalStore(noSubscribe, hourNow, () => null);
  const date = useSyncExternalStore(noSubscribe, dateNow, () => "");

  const hello = hour === null ? "Welcome back" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {hello}, {name}
      </h1>
      <p className="mt-1.5 min-h-5 text-sm text-muted-foreground">{date}</p>
    </div>
  );
}
