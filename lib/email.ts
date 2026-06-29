import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "Голубиная почта <onboarding@resend.dev>";

export interface DigestTarget {
  email: string;
  count: number;
  link: string;
}

/** Russian plural for "голубь" (1 голубь, 2–4 голубя, 5+ голубей). */
export function pluralPigeons(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "голубь";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "голубя";
  return "голубей";
}

export async function sendDigest(
  t: DigestTarget,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  if (!t.email) return { ok: false, error: "no recipient email" };

  const resend = new Resend(apiKey);
  const noun = pluralPigeons(t.count);
  const verb = t.count % 10 === 1 && t.count % 100 !== 11 ? "ждёт" : "ждут";

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: t.email,
      subject: `🕊️ Тебя ${verb} ${t.count} ${noun}`,
      html: digestHtml(t, noun, verb),
    });
    if (error) return { ok: false, error: error.message ?? String(error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

function digestHtml(t: DigestTarget, noun: string, verb: string): string {
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#3a221d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:radial-gradient(120% 120% at 50% 0%,#ecae6a 0%,#c87a4e 45%,#3a221d 100%);padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:420px;">
        <tr><td align="center" style="font-size:56px;line-height:1;padding-bottom:8px;">🕊️</td></tr>
        <tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;color:#f7eeda;font-size:24px;padding-bottom:6px;">
          Тебя ${verb} ${t.count} ${noun}
        </td></tr>
        <tr><td align="center" style="font-family:Georgia,serif;color:#f7eeda;opacity:0.85;font-size:15px;font-style:italic;padding-bottom:24px;">
          Где бы ты ни была — письмо уже прилетело.
        </td></tr>
        <tr><td align="center">
          <a href="${t.link}" style="display:inline-block;background:#f7eeda;color:#7d3f30;text-decoration:none;font-family:Georgia,serif;font-size:17px;padding:13px 28px;border-radius:999px;">
            Открыть письма
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
