# Голубиная почта / Pigeon Post

Pigeon Post lets one author pre-write letters that "land" one per morning in the
private mailbox of one recipient on a road trip with almost no internet. She opens
a secret link, sees which pigeons are still in flight and when they arrive, reads
landed letters through a GSAP arrival animation, and keeps them in an archive
that the service worker serves offline.

Status: one-off from June 2026, not maintained

## Run

With no `DATABASE_URL` set, the app runs on an embedded PGlite database in `.data/honey` and applies migrations on first use.

```
npm install
npm run db:setup        # creates the recipient, writes AUTHOR_TOKEN and links to .env.local
npm run dev -- -p 3100  # the setup script prints links assuming port 3100
npm test                # vitest, lib/letters
```

Open the printed `/loft/<token>` link to write letters and the `/m/<token>` link
to read them. Letters land at 08:00 in the recipient's timezone.

Env vars read by the code (see `.env.example` for placeholders):

| Var | Used for |
| --- | --- |
| `AUTHOR_TOKEN` | gates `/loft/<token>` (set by `db:setup`) |
| `DATABASE_URL` | Postgres for prod (Neon); omit for local PGlite |
| `RESEND_API_KEY`, `EMAIL_FROM` | daily digest email via Resend |
| `RECIPIENT_EMAIL`, `RECIPIENT_URL` or `APP_BASE_URL` | digest target and link |
| `CRON_SECRET` | if set, `/api/cron/digest` requires `Authorization: Bearer <secret>` |
| `RECIPIENT_NAME`, `RECIPIENT_TZ` | defaults for `db:setup` |

Production: `DATABASE_URL=... npm run db:migrate`, then
`DATABASE_URL=... npm run db:setup` and copy the printed tokens into Vercel env.
`vercel.json` schedules `/api/cron/digest` at 06:00 UTC daily. `npm run db:smoke`
seeds three letters and prints their flight status.

## Layout

| Path | What lives there |
| --- | --- |
| `app/loft/[token]` | author composer. Create, edit, and delete undelivered letters |
| `app/m/[token]` | recipient mailbox. In-flight ETAs, landed letters, and the archive |
| `app/api/cron/digest` | Resend digest for landed-unread letters |
| `app/manifest.ts`, `public/sw.js` | PWA manifest and offline service worker |
| `components/Ceremony.tsx` | GSAP arrival animation with reduced-motion fallback |
| `lib/letters` | flight status, categorize, Russian ETA labels, with the only tests |
| `lib/db`, `lib/auth`, `lib/email`, `lib/time` | schema and migrations, token hashing, digest, timezone math |
| `scripts/` | `db-smoke.ts`, `setup-dev.ts`, `migrate.ts` |
| `specs/SPEC.md` | original product and technical spec |

## Not done

- The digest mails the first recipient's `recipients.email` (falling back to `RECIPIENT_EMAIL` from env) and counts letters across all recipients rather than per-recipient.
- Offline reading covers only the last mailbox page the service worker cached. The IndexedDB letter cache in the spec was not built.
- Spec items deferred to later: reply pigeons (the `direction` enum exists, nothing writes `to_you`), photo or voice attachments, web push.
