"use client";

import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

// The top bar has an empty slot on its right. A page puts its main buttons there by rendering
// <TopBarActions>...</TopBarActions>, wherever it likes in its own tree.
const SlotContext = createContext(null);

export function TopBarSlotProvider({ children }) {
  const [element, setElement] = useState(null);
  return <SlotContext.Provider value={{ element, setElement }}>{children}</SlotContext.Provider>;
}

export function TopBarSlot({ className }) {
  const ctx = useContext(SlotContext);
  return <div ref={ctx?.setElement} className={className} />;
}

export function TopBarActions({ children }) {
  const ctx = useContext(SlotContext);
  return ctx?.element ? createPortal(children, ctx.element) : null;
}
