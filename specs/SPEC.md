# 🕊️ Pigeon Post — Product & Technical Spec (Phase 1)

> A playful, web-native "carrier-pigeon mail" experience: you compose letters, a pigeon
> "delivers" them on a schedule with a delightful animation, and the recipient gets a daily
> surprise — even while on the road with almost no internet.
>
> **Origin:** the recipient is traveling by car with intermittent connectivity. Asked what
> would make the trip feel closer, the answer was "send me letters by pigeons" —
> this product literally fulfills that.

**Status:** Phase 1 (spec). No implementation until "APPROVED: build".
**Locked decisions (from brainstorm):** daily-drip scheduling · in-flight + ETA visibility ·
daily email digest · one-way (author → recipient) first, replies deferred but data-model-ready.

---

## 0. Name (open — pick one)

| Option | Note |
| --- | --- |
| **«Голубиная почта» / "Pigeon Post"** *(recommended)* | Direct, warm, matches the origin request. Works in RU + EN. |
| **«Голубь» / "Golub"** | One word — the pigeon itself. Intimate, simple. |
| **"The Loft"** | The pigeon's home; doubles as your authoring space. |

App surface/copy can stay bilingual-friendly (the original request was in Russian).

---

## 1. Product Spec

**Problem.** The recipient will spend days on a road trip with little/no connectivity; you'll
both miss each other. They asked — playfully but for real — to receive *letters by pigeon*. There's
no web-native, romantic, **offline-friendly** way to deliver scheduled, surprise love letters
that feel like a *gift*, not a chat app.

**Target users.**
- **The recipient.** Opens a secret link on their phone. Intermittently online. Wants delight
  + comfort. Zero setup, no login, no accounts.
- **You (author/sender).** Pre-write and schedule letters, ideally from your phone. Want it to
  feel magical and be effortless to run.

**Core user stories.**
1. As the author, I can write and schedule a sequence of letters before the recipient leaves, so
   one arrives each morning of their trip.
2. As the recipient, when I open my secret link, I see which pigeons have landed and can read
   them with a delightful animation.
3. As the recipient, I can see a pigeon is *on its way* and roughly when it lands — something to
   look forward to.
4. As the recipient, I can revisit every letter I've received in my mailbox, **even with no
   internet.**
5. As the recipient, I get a gentle daily email nudge when letters are waiting, so I remember to
   check when I find signal.

**Delight moments (where the magic lives).**
- **The arrival ceremony** — a pigeon glides in, a peony wax seal breaks, the letter unfolds, and
  your words appear as if being written.
- **Offline re-reading** — your words in their pocket in the middle of nowhere.
- **Anticipation** — "a pigeon is on its way."
- **Personal touches** — peonies, golden-hour warmth, the recipient's name, handwriting feel.

**Non-goals / out of scope (MVP).**
- No accounts, signup, passwords, social features, or multi-user UI.
- No real-time chat.
- No reply pigeons yet (deferred to v1.1; schema is ready for it).
- No media attachments yet (text first; photos/voice later).
- No native app (PWA only).
- No analytics, marketing site, or moderation systems (it's private, two people).

---

## 2. Feature Spec (acceptance criteria are Given / When / Then)

### MVP

**F1 — Secret-link access (no login).**
- Given a valid recipient token in the URL, When the recipient opens it, Then they see their
  mailbox with no login step.
- Given an invalid/missing token, When the page loads, Then they see a gentle "this link isn't
  quite right" state and **no letter data is exposed**.

**F2 — Author Loft (compose + schedule a journey).**
- Given the author opens the secret Loft URL, When they create a "journey" (start date + N
  letters), Then each letter is saved with `arrive_at` set to consecutive mornings.
- Given a letter not yet delivered, When the author edits or deletes it, Then changes persist.
- Given a letter whose `arrive_at` has passed, When the author views the Loft, Then it shows as
  "delivered" and cannot be un-sent.

**F3 — In-flight + ETA.**
- Given letters with `arrive_at` in the future, When the recipient opens their mailbox, Then they
  see them as "in flight" with a relative ETA ("landing tomorrow morning") and **cannot read the
  body** (server withholds it).

**F4 — Landing + arrival ceremony.**
- Given a letter with `arrive_at ≤ now` and `read_at` null, When the recipient opens their
  mailbox, Then it appears as a newly-landed pigeon.
- When they tap it, Then the GSAP arrival ceremony plays and the letter body is revealed.
- When the ceremony completes or they tap to skip, Then `read_at` is set.

**F5 — Growing mailbox keepsake.**
- Given previously-read letters, When the recipient opens their mailbox, Then they see them
  newest-first and can re-open and re-read any of them.

**F6 — Offline re-read (PWA).**
- Given they opened the app online at least once and read letters, When they're later offline,
  Then they can re-open the cached app and re-read previously-loaded letters.
- Given they're offline and new letters haven't been fetched, When they open the app, Then they
  see a clear "waiting for a signal to fetch new pigeons" state (no crash).

**F7 — Daily email digest.**
- Given the recipient has ≥1 landed-unread letter, When the daily cron runs, Then they receive at
  most one "pigeons are waiting 🕊️" email that day.
- Given zero landed-unread letters, When the cron runs, Then no email is sent.

**F8 — Aesthetic & motion baseline.**
- Given any screen, Then it uses the golden-hour palette, film grain, handwritten/serif type, and
  the peony motif.
- Given `prefers-reduced-motion`, When the ceremony would play, Then a tasteful reduced version
  (cross-dissolve) plays instead.

### Later (post-MVP, separate cycle)
- Reply pigeons (recipient → you) · photo attachments (Vercel Blob) → voice notes · spontaneous
  "express pigeon" · sealed-teaser countdown variant · web push for installed PWA · map/sky flight
  visualization along the recipient's route.

---

## 3. Technical Spec (one recommendation each)

| Concern | Decision | One-line rationale |
| --- | --- | --- |
| Framework | **Next.js (App Router, TypeScript)** on **Vercel** Hobby | Best free-tier DX on Vercel; RSC + route handlers for the tiny API; easy PWA. |
| Styling | **Tailwind CSS v4** + custom golden-hour theme tokens (+ a few shadcn/ui form primitives for the Loft) | Fast, consistent, mobile-first. |
| Animation | **GSAP 3.13** via **`@gsap/react` `useGSAP`**; plugins **MotionPath, SplitText, DrawSVG, Flip** | The magic; all plugins are now 100% free; `useGSAP` is the correct cleanup-safe React pattern. |
| Data | **Neon Postgres** (Vercel Marketplace, free) + **Drizzle ORM** | Relational fits letters/journeys/read-state/future replies; free; TS-native, serverless-friendly. |
| Media (later) | **Vercel Blob** (free, private) | Photos/voice when we add them. |
| Email | **Resend** free tier (3,000/mo · 100/day · 1 domain) | Confirmed free; ample headroom; Vercel-friendly. |
| Scheduling | **Vercel Cron** once/day → `/api/cron/digest` | Reveal is view-time computed, so cron is *only* the nudge; once/day is the Hobby limit and exactly enough. Fallback: GitHub Actions scheduled workflow. |
| Offline | Web App Manifest + service worker (Serwist) + **IndexedDB** letter cache | Her offline reality — re-read with zero signal. |
| Access | Two unguessable tokens: **recipient** (their link) + **author** (your Loft), stored **hashed** | No login, low-stakes, but never store raw tokens. |
| Time | Store UTC; render relative ETAs; "morning" anchored to a configured recipient timezone | Predictable; survives travel across timezones "well enough". |

### Data model (Drizzle / Postgres)

```
recipients (id, name, email, timezone, token_hash, created_at)
  -- MVP: a single row (the recipient). Table generalizes for later.

journeys   (id, recipient_id → recipients, title, start_date, created_at)
  -- one trip / one drip sequence.

letters    (id, journey_id → journeys, recipient_id → recipients,
            direction enum('to_her','to_you') default 'to_her',   -- makes replies trivial later
            sender_name, body text,
            depart_at, arrive_at, read_at, created_at, updated_at, deleted_at)

-- later: attachments(id, letter_id, kind, blob_url, ...)
```

`direction` is included now so v1.1 reply pigeons need no migration.

### Key flows
- **Author schedules journey** → insert `journey` + N `letters`, each `arrive_at` = morning of day _n_.
- **Recipient loads `/m/‹token›`** → validate token → return letters split into
  `in_flight` / `landed_unread` / `mailbox`. **Bodies of in-flight letters are never sent to the client.**
- **Recipient opens a landed letter** → ceremony → `POST /api/letters/:id/read` sets `read_at`.
- **Daily cron** → find recipients with ≥1 `landed_unread` → send one digest each via Resend.

### Third-party services (all free)
Vercel (host + cron) · Neon (Postgres) · Resend (email) · (later) Vercel Blob.

---

## 4. Architecture Overview

**Components**
- **Client app (Next.js, mobile-first PWA)**
  - *Recipient surface:* Sky (in-flight + landed), Mailbox (keepsake), Arrival Ceremony (GSAP),
    offline cache (IndexedDB + SW).
  - *Author surface:* Loft (journey composer, letter editor, schedule, delivered list).
- **API (Next.js route handlers, thin)**
  - `GET /api/letters` (recipient-token scoped) → categorized letters, bodies withheld for in-flight.
  - `POST /api/letters/:id/read`.
  - Author CRUD `…/api/loft/*` (author-token scoped).
  - `GET /api/cron/digest` (cron-secret protected).
- **Data:** Neon Postgres via Drizzle. **Email:** Resend.

**The "pigeon delivery" mechanism — timing, state, animation**
- **Timing.** Each letter has `depart_at` (sent) and `arrive_at` (scheduled landing, e.g. 08:00
  recipient-tz on day _n_).
- **State (derived, not stored):**
  - `in_flight` — `now < arrive_at` → shown with ETA, **body withheld by the server**.
  - `landed_unread` — `arrive_at ≤ now` and `read_at` null → triggers the ceremony.
  - `read` — `read_at` set → mailbox keepsake.
  - Derivation runs **server-side** (security: never ship future bodies) and the client recomputes
    ETA labels live.
- **Where the magic lives — the Arrival Ceremony** (one self-contained, prop-driven client unit;
  a single GSAP master timeline):
  1. golden-hour sky fades in →
  2. pigeon enters along a **MotionPath** curve (`autoRotate` so it banks naturally) →
  3. pigeon "drops" the letter (Flip/transform) →
  4. **peony wax seal** draws in (DrawSVG) then cracks →
  5. the letter unfolds →
  6. **SplitText** reveals the text line-by-line, as if written →
  7. peony petals drift and settle.
  - `prefers-reduced-motion` → graceful cross-dissolve. Tap-to-skip supported.
- **Offline.** SW caches the app shell; every successful load writes fetched letters to IndexedDB;
  offline opens read from IndexedDB. Brand-new (in-flight → landed) letters require a moment of
  connectivity to fetch their bodies — by design, since the server withholds future bodies.

**Module boundaries (small, single-purpose, independently testable)**
- `lib/letters` — pure domain: `categorize(letters, now)`, `etaLabel(arrive_at, now)`. No I/O.
- `lib/auth` — token hashing + recipient/author verification.
- `lib/db` — Drizzle schema + queries.
- `lib/email` — Resend digest render + send.
- `components/ceremony` — GSAP arrival; prop-driven; no data fetching.
- `components/sky`, `components/mailbox`, `components/loft`.
- `app/api/*` — thin route handlers that call `lib/*`.

---

## 5. Implementation Plan (vertical slices, each demoable · S/M/L)

| # | Milestone | Size | Ships (demo) | Verifies |
| --- | --- | --- | --- | --- |
| **M0** | Scaffold & deploy skeleton | S | Next.js+TS+Tailwind, GSAP installed (per gsap-skills), Neon connected, **live on Vercel via CLI** — a styled golden-hour placeholder. | Loads on the recipient's phone. |
| **M1** | Data + author Loft | M | Drizzle schema; author-token Loft to create a journey and write/schedule letters (one per morning). | F2 |
| **M2** | Recipient mailbox: Sky + landed | M | `/m/‹token›`; server categorizes; in-flight shows ETA (body withheld); landed opens (basic read) → sets `read_at`; mailbox lists read letters. | F1, F3, F4(basic), F5 |
| **M3** | The arrival ceremony | L | Full GSAP timeline (sky → pigeon MotionPath → peony seal → unfold → SplitText → petals), reduced-motion fallback, tap-to-skip. | F4, F8 |
| **M4** | Offline PWA | M | Manifest + SW + IndexedDB cache; offline re-read; "waiting for signal" state. | F6 |
| **M5** | Daily email digest | S | Resend + `/api/cron/digest` + vercel cron (once/day) + email template. | F7 |
| **M6** | Polish & real content | S/M | Final aesthetic pass (grain, type, peony art, microcopy, recipient's name); you write the real journey; set the recipient's tz + email (`RECIPIENT_NAME`, `RECIPIENT_TZ`); generate their secret link; end-to-end smoke test; ship. | All; ready to send. |

*Post-MVP (separate cycle):* reply pigeons · photo/voice attachments · express pigeon · web push ·
route/map flight viz.

---

## 6. Risks & Open Decisions

**Risks (with mitigations)**
- **Email deliverability.** A fresh sender may land in spam. Mitigate with a verified domain
  (needs a domain) or a subdomain; if none, deliverability is weaker — so the **app is the primary
  surface and email is a best-effort nudge.**
- **Cron imprecision (±59 min, once/day).** Fine for a nudge; the **reveal never depends on cron**,
  so letters are never late to *appear*.
- **Timezone drift while traveling.** "Morning" anchored to one configured tz — good enough.
- **Offline expectation.** She can only re-read letters already fetched while online; brand-new
  ones need a moment of signal. Set expectation in copy.
- **GSAP + SSR/React 19.** Keep all animation client-only (`'use client'` + `useGSAP`) — known, handled.
- **Secret-link leakage.** A shared screenshot exposes the link. Low-stakes per your call; mitigate
  with long random tokens (+ optional rotation).
- **Ceremony scope creep (the L).** Timebox M3: great-but-bounded first, iterate later.

**Open decisions for you**
1. **Name** — pick from §0.
2. **Domain** — own/want a free subdomain (nicer email + URL), or use default `*.vercel.app`?
3. **Recipient timezone & email** — needed at M6 (not blocking earlier); set via `RECIPIENT_TZ` / `RECIPIENT_EMAIL`.
4. **"Morning" landing time** — default **08:00** in the recipient's tz (`RECIPIENT_TZ`, fallback UTC), OK?
5. **Trip length / number of letters** — shapes the journey composer defaults.
6. **Letter typography** — handwriting vs elegant serif (I'll show options in M3).

---

*Spec ready. Reply **"APPROVED: build"** to start Phase 2, or tell me what to change.*
