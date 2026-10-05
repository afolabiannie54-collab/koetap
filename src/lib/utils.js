import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// "1 product" / "2 products"
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
