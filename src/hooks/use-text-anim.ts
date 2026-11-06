import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Check if element is in viewport
 */
function isInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.top <= window.innerHeight && rect.bottom >= 0;
}

/**
 * Split text into characters and animate them into place —
 * inspired by CodePen filipz/QwwQYRE (rotated char reveal, staggered).
 * Preserves original text for a11y (visually-hidden mirror not needed —
 * chars are inline spans so screen readers still read them in order).
 */
export function useSplitCharReveal<
  T extends HTMLElement = HTMLHeadingElement,
>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let ctx: gsap.Context | null = null;
    let originalHTML = "";

    // Defer DOM splitting and GSAP setup after initial browser paint to unblock main thread
    const animationFrameId = requestAnimationFrame(() => {
      if (!el || !el.isConnected) return;
      originalHTML = el.innerHTML;

      // Split each text node into per-char spans, skipping nodes with data-no-split
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let n: Node | null;
      while ((n = walker.nextNode())) {
        const parent = n.parentNode as HTMLElement | null;
        if (parent?.closest("[data-no-split]")) continue;
        if (n.nodeValue && n.nodeValue.trim().length > 0) textNodes.push(n as Text);
      }
      const chars: HTMLElement[] = [];
      textNodes.forEach((tn) => {
        const frag = document.createDocumentFragment();
        const txt = tn.nodeValue ?? "";
        for (const ch of txt) {
          if (ch === " ") {
            frag.appendChild(document.createTextNode(" "));
            continue;
          }
          const s = document.createElement("span");
          s.textContent = ch;
          s.style.display = "inline-block";
          s.style.willChange = "transform,opacity";
          frag.appendChild(s);
          chars.push(s);
        }
        tn.parentNode?.replaceChild(frag, tn);
      });

      // Check if already in view on initial load
      const initiallyInView = isInViewport(el);

      ctx = gsap.context(() => {
        gsap.fromTo(
          chars,
          { yPercent: 15, opacity: 0.3 },
          {
            yPercent: 0,
            opacity: 1,
            rotate: 0,
            skewY: 0,
            duration: 0.25,
            ease: "power2.out",
            stagger: { each: 0.004, from: "start" },
            delay: 0,
            scrollTrigger: initiallyInView
              ? undefined
              : {
                  trigger: el,
                  start: "top 95%",
                  once: true,
                },
          },
        );
      }, el);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (ctx) ctx.revert();
      if (originalHTML && el) el.innerHTML = originalHTML;
    };
  }, []);
  return ref;
}

/**
 * Scramble-text effect for section headings & accent words — cycles random glyphs briefly
 * then resolves to the original text on scroll-into-view or immediate load.
 */
export function useScrambleReveal<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    if (!el.dataset.originalText) {
      el.dataset.originalText = el.textContent ?? "";
    }
    const original = el.dataset.originalText;
    const glyphs = "!@#$%^&*<>/?[]{}=+ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    let raf = 0;
    let isScrambling = false;

    const scramble = () => {
      if (isScrambling) return;
      isScrambling = true;
      const duration = 200; // Snappy 200ms cybernetic scramble
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const revealCount = Math.floor(p * original.length);
        let out = "";
        for (let i = 0; i < original.length; i++) {
          if (i < revealCount || original[i] === " " || original[i] === "\n") {
            out += original[i];
          } else {
            out += glyphs[Math.floor(Math.random() * glyphs.length)];
          }
        }
        el.textContent = out;
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          el.textContent = original;
          isScrambling = false;
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            scramble();
          } else {
            isScrambling = false;
            cancelAnimationFrame(raf);
            el.textContent = original;
          }
        });
      },
      { threshold: 0.15 },
    );

    io.observe(el);

    // Initial check if already in view
    if (isInViewport(el)) {
      scramble();
    }

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = original;
    };
  }, []);
  return ref;
}

/**
 * Word-by-word slide reveal — lighter alternative for paragraphs.
 */
export function useWordReveal<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let ctx: gsap.Context | null = null;
    let originalHTML = "";

    const animationFrameId = requestAnimationFrame(() => {
      if (!el || !el.isConnected) return;
      originalHTML = el.innerHTML;
      const words = (el.textContent ?? "").split(/(\s+)/);
      el.textContent = "";
      const spans: HTMLElement[] = [];
      words.forEach((w) => {
        if (/^\s+$/.test(w)) {
          el.appendChild(document.createTextNode(w));
        } else {
          const s = document.createElement("span");
          s.textContent = w;
          s.style.display = "inline-block";
          el.appendChild(s);
          spans.push(s);
        }
      });

      const initiallyInView = isInViewport(el);

      ctx = gsap.context(() => {
        gsap.fromTo(
          spans,
          { y: 8, opacity: 0.4 },
          {
            y: 0,
            opacity: 1,
            duration: 0.22,
            ease: "power2.out",
            stagger: 0.005,
            delay: 0,
            scrollTrigger: initiallyInView
              ? undefined
              : {
                  trigger: el,
                  start: "top 95%",
                  once: true,
                },
          },
        );
      }, el);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (ctx) ctx.revert();
      if (originalHTML && el) el.innerHTML = originalHTML;
    };
  }, []);
  return ref;
}
