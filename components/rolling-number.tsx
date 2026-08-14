"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@heroui/react";

/**
 * Odometer-style number. Each digit is a vertical reel that rolls to its value
 * — from zero on mount (so it counts up on load / whenever Home is opened) and
 * to the new value whenever `value` changes (e.g. after a conversion). Pure CSS
 * transitions; respects prefers-reduced-motion.
 */

function Cell({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-[1em] items-center justify-center leading-none">
      {children}
    </span>
  );
}

function Reel({
  digit,
  index,
  animateOnMount,
}: {
  digit: number;
  index: number;
  animateOnMount: boolean;
}) {
  // Start at 0 (then roll up) when animating on mount; otherwise start settled
  // and only animate on subsequent value changes.
  const [shown, setShown] = useState(animateOnMount ? 0 : digit);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(digit));
    return () => cancelAnimationFrame(id);
  }, [digit]);

  return (
    <span className="inline-block h-[1em] overflow-hidden align-bottom">
      <span
        className="flex flex-col motion-reduce:transition-none"
        style={{
          transform: `translateY(-${shown}em)`,
          transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          transitionDelay: `${index * 45}ms`,
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <Cell key={i}>{i}</Cell>
        ))}
      </span>
    </span>
  );
}

export function RollingNumber({
  value,
  className,
  animateOnMount = true,
}: {
  value: string;
  className?: string;
  /** Roll up from zero on mount. Set false for always-visible figures (sidebar,
   *  positions) so they only animate when the value actually changes. */
  animateOnMount?: boolean;
}) {
  const chars = value.split("");
  let digitIndex = 0;
  return (
    <span className={cn("inline-block tabular-nums", className)} aria-label={value}>
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          <Reel
            key={i}
            digit={Number(ch)}
            index={digitIndex++}
            animateOnMount={animateOnMount}
          />
        ) : (
          <span key={i} className="inline-block align-bottom" aria-hidden>
            <Cell>{ch === " " ? " " : ch}</Cell>
          </span>
        ),
      )}
    </span>
  );
}
