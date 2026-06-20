/**
 * Work-feedback email notifications.
 *
 * When a work-feedback entry is saved with one or more recipient emails, we send
 * each recipient the same HTML the entry posts to the project chat (built by
 * `buildFeedbackMessage`). Best-effort: a delivery failure never fails the save.
 */

import { sendRawEmail } from "@/lib/api/brevo";

/**
 * Send the work-feedback HTML to each recipient. Never throws — all errors are
 * swallowed so the calling server action's primary write is unaffected.
 */
export async function sendFeedbackEmails(
  emails: string[] | null | undefined,
  messageHtml: string,
  period: string
): Promise<void> {
  const recipients = Array.from(
    new Set((emails ?? []).map((e) => e.trim()).filter(Boolean))
  );
  if (recipients.length === 0) return;

  const subject = `Work feedback – ${period}`;
  const htmlContent = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1d2939;">${messageHtml}</div>`;

  try {
    const results = await Promise.allSettled(
      recipients.map((email) =>
        sendRawEmail({
          to: { email, name: email },
          subject,
          htmlContent,
          tags: ["work-feedback"],
        })
      )
    );
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error("[feedbackEmail] Failed to send to", recipients[i], r.reason);
      }
    });
  } catch (err) {
    console.error("[feedbackEmail] Unexpected error sending feedback emails:", err);
  }
}
