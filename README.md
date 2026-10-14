# Pigeon Post

Pigeon Post lets one author pre-write letters that land one per morning in someone's private mailbox. The recipient opens a secret link, sees which letters are still in flight and when they arrive, reads landed letters through an arrival animation, and keeps them in an archive that the service worker serves offline. I built it as a one-off in June 2026 for a single recipient and no longer maintain it. Names and letters in the seed data are neutral placeholders. Bring your own recipient.

## Run

With no `DATABASE_URL` set, the app runs on an embedded PGlite database in `.data/honey` and applies migrations on first use. Nothing external is required for local reading and writing.

```
npm install
npm run db:setup        # creates the recipient, writes AUTHOR_TOKEN and links to .env.local
npm run dev -- -p 3100  # the setup script prints links assuming port 3100
npm test                # vitest, lib/letters
```

Open the printed `/loft/<token>` link to write letters and the `/m/<token>` link to read them. Letters land at 08:00 in the recipient's timezone. Every variable the code reads is listed in `.env.example`, with `RECIPIENT_NAME` and `RECIPIENT_TZ` defaulting the setup.

Production is one Postgres: set `DATABASE_URL` (Neon fits), run `npm run db:migrate`, then `npm run db:setup` and copy the printed tokens into Vercel env. `vercel.json` schedules `/api/cron/digest` once a day, which mails the digest through Resend. `npm run db:smoke` seeds three placeholder letters and prints their flight status.

## Layout

| Path | What lives there |
| --- | --- |
| `app/loft/[token]` | author composer. Create, edit, and delete undelivered letters |
| `app/m/[token]` | recipient mailbox. In-flight ETAs, landed letters, and the archive |
| `app/api/cron/digest` | Resend digest for landed-unread letters |
| `app/manifest.ts`, `public/sw.js` | PWA manifest and offline service worker |
| `components/Ceremony.tsx` | arrival animation with reduced-motion fallback |
| `lib/letters` | flight status, categorize, ETA labels, with the only tests |
| `lib/db`, `lib/auth`, `lib/email`, `lib/time` | schema and migrations, token hashing, digest, timezone math |
| `scripts/` | `db-smoke.ts`, `setup-dev.ts`, `migrate.ts` |
| `specs/SPEC.md` | original product and technical spec |

## Not done

- The digest counts letters across all recipients rather than per-recipient. Single-recipient use is unaffected.
- Offline reading covers only the last mailbox page the service worker cached. The IndexedDB letter cache in the spec was not built.
- Deferred from the spec: reply letters (the `direction` enum exists, nothing writes the reverse direction), photo or voice attachments, web push.
