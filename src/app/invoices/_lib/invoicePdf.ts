/**
 * Client-side invoice PDF generation.
 *
 * Renders the inline-styled invoice document offscreen, rasterizes it with
 * html2canvas, and lays it onto an A4 jsPDF. Returns the PDF as a bare base64
 * string (no `data:` prefix) suitable for a Brevo email attachment.
 */

import type { Invoice } from "@/types/docs";
import { buildInvoiceDocumentHtml } from "./invoiceDocument";

const RENDER_WIDTH_PX = 794; // ~A4 width at 96dpi, keeps layout proportions sane

/** Generate the invoice PDF and return its base64 content (no data URI prefix). */
export async function generateInvoicePdfBase64(invoice: Invoice): Promise<string> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Offscreen host: rendered (so html2canvas can measure) but out of view.
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${RENDER_WIDTH_PX}px`;
  host.style.background = "#ffffff";
  host.innerHTML = buildInvoiceDocumentHtml(invoice);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: RENDER_WIDTH_PX,
      logging: false,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    // Single page, or paginate by shifting the same image up one page at a time.
    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    const dataUri = pdf.output("datauristring");
    return dataUri.substring(dataUri.indexOf(",") + 1);
  } finally {
    document.body.removeChild(host);
  }
}
