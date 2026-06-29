"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(useGSAP, MotionPathPlugin);

interface CeremonyProps {
  body: string;
  senderName: string;
  /** true = play the full arrival ceremony (first open); false = quick reveal (re-read). */
  grand: boolean;
  onClose: () => void;
}

// fixed petal layout (no randomness at render -> no hydration surprises)
const PETALS = [
  { left: "38%", top: "20%", size: 13 },
  { left: "52%", top: "16%", size: 10 },
  { left: "46%", top: "24%", size: 16 },
  { left: "60%", top: "22%", size: 11 },
  { left: "42%", top: "18%", size: 9 },
  { left: "56%", top: "26%", size: 14 },
  { left: "50%", top: "21%", size: 12 },
];

export default function Ceremony({
  body,
  senderName,
  grand,
  onClose,
}: CeremonyProps) {
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [done, setDone] = useState(false);

  // keep whitespace tokens so words wrap with natural spacing
  const tokens = body.split(/(\s+)/);

  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // Quick reveal: re-reading a saved letter, or reduced motion.
      if (!grand || reduce) {
        gsap.set([".cer-letter", ".cer-paper", ".cer-word", ".cer-sign", ".cer-close"], {
          opacity: 1,
          y: 0,
          scaleY: 1,
        });
        gsap.set([".cer-dove", ".cer-seal", ".cer-petal"], { opacity: 0 });
        gsap.from(".cer-letter", { opacity: 0, y: 18, duration: 0.55 });
        gsap.to(".cer-backdrop", { opacity: 1, duration: 0.45 });
        setDone(true);
        return;
      }

      // ---- The full ceremony ----
      gsap.set(".cer-backdrop", { opacity: 0 });
      gsap.set(".cer-dove", { opacity: 0 });
      gsap.set(".cer-letter", { opacity: 0 });
      gsap.set(".cer-paper", { scaleY: 0.06, transformOrigin: "50% 14%" });
      gsap.set(".cer-seal", { opacity: 0, scale: 0.5, transformOrigin: "50% 50%" });
      gsap.set([".seal-half-l", ".seal-half-r", ".cer-seal-core"], {
        opacity: 1,
        rotation: 0,
        x: 0,
        y: 0,
      });
      gsap.set(".cer-word", { opacity: 0, y: 14 });
      gsap.set(".cer-sign", { opacity: 0 });
      gsap.set(".cer-close", { opacity: 0 });
      gsap.set(".cer-petal", { opacity: 0, y: 0, x: 0, rotation: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => setDone(true),
      });
      tlRef.current = tl;

      tl
        // backdrop
        .to(".cer-backdrop", { opacity: 1, duration: 0.6 }, 0)
        // dove glides in along the curved path, banking naturally
        .to(".cer-dove", { opacity: 1, duration: 0.4 }, 0.2)
        .to(
          ".cer-dove",
          {
            motionPath: {
              path: "#flightPath",
              align: "#flightPath",
              // no autoRotate: the 🕊️ emoji faces left, and the path runs
              // right-to-left, so it already flies the way it's facing.
              autoRotate: false,
              alignOrigin: [0.5, 0.5],
            },
            duration: 2.0,
            ease: "power1.inOut",
          },
          0.2,
        )
        // the sealed letter is delivered (still folded)
        .to(".cer-letter", { opacity: 1, duration: 0.3 }, 1.55)
        .to(".cer-seal", { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, 1.65)
        // dove departs
        .to(".cer-dove", { opacity: 0, duration: 0.5 }, 2.0)
        // seal cracks open
        .to(".cer-seal", { scale: 1.08, duration: 0.16, ease: "power1.in" }, 2.5)
        .to(".seal-half-l", { rotation: -28, x: -12, y: 8, opacity: 0, duration: 0.6, ease: "power2.in" }, 2.6)
        .to(".seal-half-r", { rotation: 28, x: 12, y: 8, opacity: 0, duration: 0.6, ease: "power2.in" }, 2.6)
        .to(".cer-seal-core", { scale: 1.4, opacity: 0, duration: 0.5 }, 2.6)
        // paper unfolds
        .to(".cer-paper", { scaleY: 1, duration: 0.85, ease: "power3.out" }, 2.9)
        // petals drift down
        .to(".cer-petal", { opacity: 0.85, duration: 0.4 }, 2.95)
        .to(
          ".cer-petal",
          {
            y: () => gsap.utils.random(360, 520),
            x: () => gsap.utils.random(-60, 60),
            rotation: () => gsap.utils.random(-140, 140),
            opacity: 0,
            duration: () => gsap.utils.random(2.6, 4),
            ease: "sine.in",
            stagger: 0.12,
          },
          3.0,
        )
        // words write themselves in
        .to(".cer-word", { opacity: 1, y: 0, stagger: 0.035, duration: 0.5 }, 3.5)
        // signature, then close
        .to(".cer-sign", { opacity: 1, duration: 0.8 }, ">-0.1")
        .to(".cer-close", { opacity: 1, duration: 0.5 }, ">-0.2");
    },
    { scope: root, dependencies: [grand] },
  );

  function handleBackdrop() {
    if (!done && tlRef.current) {
      tlRef.current.progress(1); // skip to the end
      setDone(true);
    } else {
      onClose();
    }
  }

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      onClick={handleBackdrop}
    >
      <div className="cer-backdrop absolute inset-0 bg-dusk/80 backdrop-blur-sm" />

      {/* flight layer */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <path id="flightPath" d="M440,120 C330,45 150,250 196,360" fill="none" stroke="none" />
        <text
          className="cer-dove"
          x="0"
          y="0"
          fontSize="38"
          textAnchor="middle"
          dominantBaseline="central"
        >
          🕊️
        </text>
      </svg>

      {/* drifting petals */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {PETALS.map((p, i) => (
          <span
            key={i}
            className="cer-petal absolute block bg-peony/80"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              borderRadius: "50% 50% 50% 0",
              transform: "rotate(45deg)",
            }}
          />
        ))}
      </div>

      {/* the letter */}
      <article
        className="cer-letter relative z-10 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* peony wax seal */}
        <svg
          className="cer-seal absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2"
          width="92"
          height="92"
          viewBox="0 0 120 120"
          aria-hidden
        >
          <path
            className="seal-half-l"
            d="M60,16 A44,44 0 0,0 60,104 Z"
            fill="#a85842"
            stroke="#7d3f30"
            strokeWidth="2"
          />
          <path
            className="seal-half-r"
            d="M60,16 A44,44 0 0,1 60,104 Z"
            fill="#b5634b"
            stroke="#7d3f30"
            strokeWidth="2"
          />
          <g className="cer-seal-core" fill="#ecb6bd" style={{ transformOrigin: "60px 60px" }}>
            <ellipse cx="60" cy="46" rx="6" ry="12" />
            <ellipse cx="60" cy="46" rx="6" ry="12" transform="rotate(72 60 60)" />
            <ellipse cx="60" cy="46" rx="6" ry="12" transform="rotate(144 60 60)" />
            <ellipse cx="60" cy="46" rx="6" ry="12" transform="rotate(216 60 60)" />
            <ellipse cx="60" cy="46" rx="6" ry="12" transform="rotate(288 60 60)" />
            <circle cx="60" cy="60" r="7" fill="#cf7d86" />
          </g>
        </svg>

        {/* paper */}
        <div
          className={`cer-paper rounded-3xl bg-cream p-7 text-ink shadow-[0_24px_90px_rgba(0,0,0,0.55)] ${
            done ? "max-h-[80dvh] overflow-y-auto" : "overflow-hidden"
          }`}
        >
          <p className="font-serif text-xl leading-relaxed text-ink">
            {tokens.map((t, i) =>
              t.trim() === "" ? (
                t
              ) : (
                <span key={i} className="cer-word inline-block">
                  {t}
                </span>
              ),
            )}
          </p>
          <p className="cer-sign mt-6 text-right font-hand text-2xl text-terracotta">
            — {senderName}
          </p>
          <button
            onClick={onClose}
            className="cer-close mt-6 w-full rounded-full bg-terracotta/10 py-2 font-serif text-sm text-terracotta"
          >
            закрыть
          </button>
        </div>
      </article>

      {!done && (
        <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center font-serif text-sm text-cream/55">
          нажми, чтобы пропустить
        </p>
      )}
    </div>
  );
}
