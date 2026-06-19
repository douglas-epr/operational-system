/**
 * Inline-styled invoice document HTML.
 *
 * This mirrors the on-screen InvoicePreview layout but uses INLINE HEX styles
 * (no Tailwind utility classes). Tailwind v4 emits `oklch()` colors which
 * html2canvas cannot parse — rendering this hex-only markup offscreen lets us
 * rasterize a faithful invoice to a canvas → PDF for emailing.
 */

import type { Invoice } from "@/types/docs";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Strip XSS vectors from the rich-text service description before it is injected
 * as HTML into the offscreen render host. Mirrors the server-side sanitizer in
 * invoices/actions.ts so the client PDF path is self-defending even if the
 * value ever arrives unsanitized.
 */
function sanitizeRichHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/\s+(?:href|src|action)\s*=\s*["']?\s*(?:javascript|data):[^"'\s>]*/gi, "");
}

function formatMoney(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/** Build a self-contained, inline-styled HTML fragment for one invoice. */
export function buildInvoiceDocumentHtml(invoice: Invoice): string {
  const symbol = invoice.currency ?? "$";
  const issueDate = formatDate(invoice.created_at ? invoice.created_at.slice(0, 10) : null);

  const legacyPayment = [
    invoice.swift_code ? `SWIFT / BIC: ${invoice.swift_code}` : null,
    invoice.iban_code ? `IBAN: ${invoice.iban_code}` : null,
  ].filter(Boolean).join("\n");
  const paymentDetails = invoice.account_details || legacyPayment;

  const periodLabel =
    invoice.start_date && invoice.end_date
      ? `${formatDate(invoice.start_date)} – ${formatDate(invoice.end_date)}`
      : null;

  const metaLine = (periodLabel || invoice.total_time != null)
    ? `<p style="margin:2px 0 0;font-size:11px;color:#737373;">${periodLabel ?? ""}${periodLabel && invoice.total_time != null ? " · " : ""}${invoice.total_time != null ? `${invoice.total_time}h worked` : ""}</p>`
    : "";

  // service_description is rich HTML, sanitized server-side at save time and
  // re-sanitized here as defense-in-depth before being injected as HTML.
  const descBlock = invoice.service_description
    ? `<div style="font-size:12px;color:#525252;margin-top:6px;">${sanitizeRichHtml(invoice.service_description)}</div>`
    : "";

  const fromLines = [
    invoice.document_number ? `<p style="margin:0;font-size:12px;color:#525252;">ID: ${escapeHtml(invoice.document_number)}</p>` : "",
    invoice.address ? `<p style="margin:0;font-size:12px;color:#525252;white-space:pre-line;">${escapeHtml(invoice.address)}</p>` : "",
    invoice.phone ? `<p style="margin:0;font-size:12px;color:#525252;">${escapeHtml(invoice.phone)}</p>` : "",
    invoice.email ? `<p style="margin:0;font-size:12px;color:#525252;">${escapeHtml(invoice.email)}</p>` : "",
  ].join("");

  const paymentBlock = paymentDetails
    ? `<div style="margin-top:28px;">
         <p style="margin:0 0 4px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;">Payment details</p>
         <p style="margin:0;font-size:12px;color:#404040;white-space:pre-line;">${escapeHtml(paymentDetails)}</p>
       </div>`
    : "";

  return `
  <div style="background:#ffffff;color:#171717;font-family:Arial,Helvetica,sans-serif;padding:40px;box-sizing:border-box;width:100%;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:24px;border-bottom:4px solid #7c3aed;">
      <div>
        <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:6px;color:#6d28d9;">INVOICE</p>
        <p style="margin:4px 0 0;font-size:12px;color:#737373;">#${escapeHtml(invoice.code)}</p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;">Issued by</p>
        <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:#171717;">${escapeHtml(invoice.company_or_user_name ?? "—")}</p>
      </div>
    </div>

    <table style="width:100%;margin-top:28px;border-collapse:collapse;"><tr>
      <td style="vertical-align:top;width:60%;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;">From</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#171717;">${escapeHtml(invoice.company_or_user_name ?? "—")}</p>
        ${fromLines}
      </td>
      <td style="vertical-align:top;text-align:right;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;">Invoice to</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#171717;">${escapeHtml(invoice.client_name ?? "—")}</p>
      </td>
    </tr></table>

    <table style="width:100%;margin-top:28px;border-collapse:collapse;"><tr>
      <td style="vertical-align:top;width:33%;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;">Issue Date</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#171717;">${issueDate}</p>
      </td>
      <td style="vertical-align:top;width:33%;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;">Due Date</p>
        <p style="margin:0;font-size:14px;font-weight:600;color:#171717;">${formatDate(invoice.due_date)}</p>
      </td>
      <td style="vertical-align:top;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#737373;">Amount Payable</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#6d28d9;">${symbol} ${formatMoney(invoice.service_price)}</p>
      </td>
    </tr></table>

    <div style="margin-top:36px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#6d28d9;color:#ffffff;">
          <td style="padding:8px 16px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Service</td>
          <td style="padding:8px 16px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;text-align:right;width:140px;">Amount</td>
        </tr>
        <tr style="border:1px solid #e5e5e5;border-top:none;">
          <td style="padding:12px 16px;vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#171717;">${escapeHtml(invoice.service_title ?? "—")}</p>
            ${metaLine}
            ${descBlock}
          </td>
          <td style="padding:12px 16px;font-size:14px;color:#171717;text-align:right;vertical-align:top;">${symbol} ${formatMoney(invoice.service_price)}</td>
        </tr>
        <tr style="border:1px solid #e5e5e5;border-top:none;background:#fafafa;">
          <td style="padding:12px 16px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#525252;">Total</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#171717;text-align:right;">${symbol} ${formatMoney(invoice.service_price)}</td>
        </tr>
      </table>
    </div>

    ${paymentBlock}

    <p style="margin-top:48px;font-size:10px;color:#a3a3a3;text-align:center;">Thank you for your business.</p>
  </div>`;
}
