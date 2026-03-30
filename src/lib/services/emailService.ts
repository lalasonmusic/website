const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "contact@lalason.com";

type SendEmailParams = {
  subject: string;
  html: string;
};

/**
 * Send an email notification to the admin via Resend.
 * Falls back to console.log if RESEND_API_KEY is not set (dev mode).
 */
export async function sendAdminEmail({ subject, html }: SendEmailParams) {
  if (!RESEND_API_KEY) {
    console.log(`[email-skipped] ${subject}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Lalason <noreply@lalason.com>",
      to: [ADMIN_EMAIL],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.error(`[email-error] ${res.status}`, await res.text());
  }
}
