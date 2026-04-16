type SendResult =
  | { ok: true; devPreviewUrl?: string }
  | { ok: false; reason: string };

const SUBJECT =
  "[Date Seoul] \ube44\ubc00\ubc88\ud638 \uc7ac\uc124\uc815 \uc548\ub0b4";

function buildHtml(resetUrl: string): string {
  const safe = resetUrl.replace(/</g, "&lt;");
  return `<p>\ube44\ubc00\ubc88\ud638\ub97c \uc7ac\uc124\uc815\ud558\ub824\uba74 \uc544\ub798 \ub9c1\ud06c\ub97c \ub20c\ub7ec\uc8fc\uc138\uc694. (\uc57d1\uc2dc\uac04 \uc720\ud6a8)</p>
<p><a href="${safe}">\ube44\ubc00\ubc88\ud638 \uc7ac\uc124\uc815\ud558\uae30</a></p>
<p style="color:#666;font-size:12px;">\ub9c1\ud06c\uac00 \ub3d9\uc791\ud558\uc9c0 \uc54a\uc73c\uba74 URL\uc744 \ubcf5\uc0ac\ud574 \ube0c\ub77c\uc6b0\uc800 \uc8fc\uc18c\uc5d0 \ubd99\uc5ec\ub123\uc73c\uc138\uc694.</p>`;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<SendResult> {
  const from = process.env.EMAIL_FROM?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: SUBJECT,
        html: buildHtml(resetUrl),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[sendPasswordResetEmail] Resend error", res.status, text);
      return { ok: false, reason: "resend" };
    }
    return { ok: true };
  }

  if (process.env.NODE_ENV === "development") {
    console.info(
      "[sendPasswordResetEmail] Dev mode (no RESEND): password reset URL\n",
      resetUrl
    );
    return { ok: true, devPreviewUrl: resetUrl };
  }

  console.error(
    "[sendPasswordResetEmail] Missing RESEND_API_KEY and EMAIL_FROM"
  );
  return { ok: false, reason: "not_configured" };
}
