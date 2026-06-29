"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRead } from "../actions";
import Ceremony from "@/components/Ceremony";

interface OpenLetter {
  id: string;
  body: string;
  senderName: string;
  grand: boolean;
}

interface MailboxView {
  name: string;
  inFlight: { id: string; eta: string }[];
  landedUnread: { id: string; body: string; senderName: string }[];
  mailbox: { id: string; body: string; senderName: string }[];
}

export default function MailboxClient({
  token,
  view,
}: {
  token: string;
  view: MailboxView;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState<OpenLetter | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  function openLetter(
    l: { id: string; body: string; senderName: string },
    unread: boolean,
  ) {
    setOpen({ ...l, grand: unread });
    if (unread) {
      startTransition(async () => {
        try {
          await markRead(token, l.id);
          router.refresh();
        } catch {
          /* best-effort; reading still works */
        }
      });
    }
  }

  const hasNothing =
    view.inFlight.length === 0 &&
    view.landedUnread.length === 0 &&
    view.mailbox.length === 0;

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-5 py-12">
      {!online && (
        <div className="rounded-2xl border border-cream/20 bg-dusk/40 px-4 py-3 text-center font-serif text-sm text-cream/85">
          Нет связи · новые голуби прилетят, когда появится сигнал.
          <span className="block text-cream/60">
            Прошлые письма всегда с тобой 🕊️
          </span>
        </div>
      )}

      <header className="text-center">
        <p className="font-hand text-3xl text-peony legible">
          Дорогая {view.name},
        </p>
        <p className="mt-1 font-serif text-sm italic text-cream/85 legible">
          голуби находят тебя, где бы ты ни была
        </p>
      </header>

      {hasNothing && (
        <p className="text-center font-serif italic text-cream/85 legible">
          Пока тихо. Скоро прилетит первый голубь 🕊️
        </p>
      )}

      {/* Just landed */}
      {view.landedUnread.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-sm uppercase tracking-wider text-cream/90 legible">
            Только что прилетело
          </h2>
          {view.landedUnread.map((l) => (
            <button
              key={l.id}
              onClick={() => openLetter(l, true)}
              className="rise group flex items-center gap-4 rounded-2xl bg-cream/95 p-5 text-left text-ink shadow-[0_10px_40px_rgba(58,34,29,0.35)] transition hover:scale-[1.01]"
            >
              <span className="text-4xl transition group-hover:-translate-y-1">
                🕊️
              </span>
              <span>
                <span className="block font-serif text-lg">Голубь прилетел</span>
                <span className="block font-serif text-sm italic text-ink/60">
                  нажми, чтобы открыть письмо
                </span>
              </span>
            </button>
          ))}
        </section>
      )}

      {/* In flight */}
      {view.inFlight.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-serif text-sm uppercase tracking-wider text-cream/90 legible">
            В пути
          </h2>
          {view.inFlight.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 rounded-2xl border border-cream/15 bg-dusk/30 px-4 py-3 backdrop-blur-sm"
            >
              <span className="text-2xl opacity-90">🕊️</span>
              <span className="font-serif text-cream">
                Голубь в пути
                <span className="block font-serif text-sm italic text-cream/75">
                  {l.eta}
                </span>
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Keepsake mailbox */}
      {view.mailbox.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-sm uppercase tracking-wider text-cream/90 legible">
            Почтовый ящик
          </h2>
          {view.mailbox.map((l) => (
            <button
              key={l.id}
              onClick={() => openLetter(l, false)}
              className="rounded-2xl bg-cream/85 p-4 text-left text-ink shadow-[0_6px_24px_rgba(58,34,29,0.25)] transition hover:scale-[1.01]"
            >
              <p className="line-clamp-2 whitespace-pre-wrap font-serif text-ink/90">
                {l.body}
              </p>
              <p className="mt-1 font-hand text-lg text-ink/55">
                — {l.senderName}
              </p>
            </button>
          ))}
        </section>
      )}

      {/* Arrival ceremony — full on first open, quick reveal on re-read */}
      {open && (
        <Ceremony
          body={open.body}
          senderName={open.senderName}
          grand={open.grand}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}
