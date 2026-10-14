"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLetter, updateLetter, deleteLetter } from "../actions";

interface LetterView {
  id: string;
  body: string;
  senderName: string;
  arriveDateLocal: string;
  delivered: boolean;
}

export default function LoftClient({
  token,
  recipientName,
  suggestedDate,
  letters,
}: {
  token: string;
  recipientName: string;
  suggestedDate: string;
  letters: LetterView[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [senderName, setSenderName] = useState("твой голубь");
  const [arriveDate, setArriveDate] = useState(suggestedDate);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setBody("");
    setSenderName("твой голубь");
    setArriveDate(suggestedDate);
    setError(null);
  }

  function startEdit(l: LetterView) {
    setEditingId(l.id);
    setBody(l.body);
    setSenderName(l.senderName || "твой голубь");
    setArriveDate(l.arriveDateLocal);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit() {
    if (!body.trim()) {
      setError("Напиши пару слов 🕊️");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updateLetter(token, { id: editingId, body, senderName, arriveDate });
        } else {
          await createLetter(token, { body, senderName, arriveDate });
        }
        resetForm();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Что-то пошло не так");
      }
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteLetter(token, id);
        if (editingId === id) resetForm();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Что-то пошло не так");
      }
    });
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-10">
      <header className="text-center">
        <p className="font-hand text-2xl text-peony legible">Голубятня</p>
        <h1 className="font-serif text-3xl text-cream legible">Письма для {recipientName}</h1>
        <p className="mt-1 font-serif text-sm italic text-cream/85 legible">
          одно письмо за раз · прилетает в 8 утра
        </p>
      </header>

      {/* Composer */}
      <section className="rounded-3xl bg-cream/95 p-5 text-ink shadow-[0_10px_40px_rgba(58,34,29,0.35)]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">
            {editingId ? "Изменить письмо" : "Новое письмо"}
          </h2>
          {editingId && (
            <button
              onClick={resetForm}
              className="font-serif text-sm text-ink/50 underline"
            >
              отмена
            </button>
          )}
        </div>

        <label className="mt-4 block font-serif text-sm text-ink/60">
          Когда прилетит
          <input
            type="date"
            value={arriveDate}
            onChange={(e) => setArriveDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 font-serif text-ink focus:border-terracotta focus:outline-none"
          />
        </label>

        <label className="mt-4 block font-serif text-sm text-ink/60">
          Письмо
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Доброе утро…"
            className="mt-1 block w-full resize-none rounded-lg border border-ink/15 bg-transparent px-3 py-2 font-serif text-lg leading-relaxed text-ink placeholder:text-ink/30 focus:border-terracotta focus:outline-none"
          />
        </label>

        <label className="mt-3 block font-serif text-sm text-ink/60">
          Подпись
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-ink/15 bg-transparent px-3 py-2 font-hand text-xl text-ink focus:border-terracotta focus:outline-none"
          />
        </label>

        {error && (
          <p className="mt-3 font-serif text-sm text-terracotta">{error}</p>
        )}

        <button
          onClick={onSubmit}
          disabled={isPending}
          className="mt-5 w-full rounded-full bg-terracotta px-5 py-3 font-serif text-lg text-cream shadow transition hover:brightness-105 disabled:opacity-60"
        >
          {isPending
            ? "…"
            : editingId
              ? "Сохранить"
              : "Отправить голубя 🕊️"}
        </button>
      </section>

      {/* Scheduled list */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-sm uppercase tracking-wider text-cream/90 legible">
          Запланировано ({letters.length})
        </h2>
        {letters.length === 0 && (
          <p className="font-serif text-sm italic text-cream/85 legible">
            Пока ни одного голубя. Напиши первое письмо ✍️
          </p>
        )}
        {letters.map((l) => (
          <article
            key={l.id}
            className="rounded-2xl bg-cream/90 p-4 text-ink shadow-[0_6px_24px_rgba(58,34,29,0.25)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm text-ink/60">
                {l.arriveDateLocal}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-serif text-xs ${
                  l.delivered
                    ? "bg-honey/30 text-ink/70"
                    : "bg-terracotta/15 text-terracotta"
                }`}
              >
                {l.delivered ? "🛬 доставлено" : "🕊️ в пути"}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap font-serif text-ink/90">
              {l.body}
            </p>
            <p className="mt-1 font-hand text-lg text-ink/60">— {l.senderName}</p>
            {!l.delivered && (
              <div className="mt-3 flex gap-4">
                <button
                  onClick={() => startEdit(l)}
                  className="font-serif text-sm text-terracotta underline"
                >
                  изменить
                </button>
                <button
                  onClick={() => onDelete(l.id)}
                  disabled={isPending}
                  className="font-serif text-sm text-ink/40 underline disabled:opacity-50"
                >
                  удалить
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
