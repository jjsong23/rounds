import type { EmailProviderSendVerificationRequestParams } from "next-auth/providers/email";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Rounds <onboarding@rounds.app>";

export async function sendVerificationRequest(params: EmailProviderSendVerificationRequestParams) {
  const { identifier: to, url } = params;

  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[dev email] Magic link for ${to}:\n  ${url}\n`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Sign in to Rounds",
    text: `Sign in to Rounds by clicking this link: ${url}`,
    html: `<p>Sign in to Rounds by clicking the link below.</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  });

  if (error) {
    throw new Error(`Resend failed to send verification email: ${error.message}`);
  }
}
