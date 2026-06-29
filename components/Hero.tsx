"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * M0 placeholder hero. Its real job is to prove the GSAP + useGSAP + Next 16 /
 * React 19 integration end-to-end (timeline entrance, perpetual float, and a
 * reduced-motion branch) — the same machinery the M3 arrival ceremony will use.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Full motion only when the visitor hasn't asked to reduce it.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(".hero-pigeon", { y: -48, autoAlpha: 0, duration: 1.3, ease: "power2.out" })
          .from(".hero-title", { y: 26, autoAlpha: 0, duration: 1.1 }, "-=0.65")
          .from(".hero-sub", { y: 16, autoAlpha: 0, duration: 1.0 }, "-=0.7")
          .from(".hero-note", { autoAlpha: 0, duration: 1.2 }, "-=0.5");

        // gentle, endless drift — the pigeon riding warm air
        gsap.to(".hero-pigeon", {
          y: "+=12",
          rotation: 2.5,
          duration: 3.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
      // Reduced-motion branch: do nothing — everything stays at its natural,
      // fully-visible resting state (no autoAlpha:0 is ever applied).
    },
    { scope: root },
  );

  return (
    <main
      ref={root}
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center"
    >
      {/* warm sun-glow behind the pigeon */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[28%] h-72 w-72 rounded-full bg-glow/40 blur-3xl"
      />

      <div className="hero-pigeon relative text-7xl drop-shadow-[0_8px_30px_rgba(58,34,29,0.45)] sm:text-8xl">
        🕊️
      </div>

      <h1
        className="hero-title relative font-serif text-5xl font-medium tracking-wide text-cream sm:text-6xl"
        style={{ textShadow: "0 1px 36px rgba(247,213,155,0.45)" }}
      >
        Голубиная&nbsp;почта
      </h1>

      <p className="hero-sub legible max-w-md font-serif text-lg italic text-cream/90 sm:text-xl">
        Letters carried to you, wherever the road takes you.
      </p>

      <p className="hero-note legible font-hand text-2xl text-peony sm:text-3xl">
        для Амиры · скоро
      </p>
    </main>
  );
}
