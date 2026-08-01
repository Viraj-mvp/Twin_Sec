import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Reveal children of the returned ref on scroll.
 * Respects prefers-reduced-motion.
 */
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(
  selector = "[data-reveal]",
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = ref.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let ctx: gsap.Context | null = null;

    const animationFrameId = requestAnimationFrame(() => {
      if (!root || !root.isConnected) return;
      ctx = gsap.context(() => {
        const items = gsap.utils.toArray<HTMLElement>(selector, root);
        items.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const initiallyInView = rect.top <= window.innerHeight && rect.bottom >= 0;
          gsap.fromTo(
            el,
            { y: 30, opacity: 0, filter: "blur(4px)" },
            {
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: initiallyInView
                ? undefined
                : {
                    trigger: el,
                    start: "top 90%",
                    once: true,
                  },
            },
          );
        });
      }, root);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (ctx) ctx.revert();
    };
  }, [selector]);

  return ref;
}

export { gsap, ScrollTrigger };
