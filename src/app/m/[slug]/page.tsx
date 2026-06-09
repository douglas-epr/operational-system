/**
 * Public landing page — /m/[slug]
 *
 * Anonymous, SSR. Exempt from the auth gate via the `/m` allowlist in
 * src/proxy.ts. Reads the published landing config with the service-role client
 * (src/lib/marketing/public.ts) and renders its `code_html` — a complete,
 * self-contained HTML document — inside a sandboxed iframe.
 *
 * The host injects a <base> tag and the capture contract (window.__MKT_SLUG__ /
 * window.__MKT_CAPTURE_URL__) into the document <head> so an in-page form can
 * POST waitlist signals to /api/m/[slug]/capture same-origin.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedLanding } from "@/lib/marketing/public";
import ViewBeacon from "./_components/ViewBeacon";

export const dynamic = "force-dynamic";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getPublishedLanding(slug);
  if (!landing) return { title: "Not found" };
  return {
    title: landing.title || "Landing page",
    robots: { index: false }, // validation pages shouldn't be indexed
  };
}

/**
 * Inject the iframe host contract into a complete HTML document:
 *   - <base href> so relative URLs (and the capture fetch) resolve same-origin.
 *   - window.__MKT_SLUG__ / window.__MKT_CAPTURE_URL__ for the in-page form.
 * Inserted immediately after the opening <head> tag; if there's no <head>, the
 * snippet is prepended (browsers still execute it).
 */
function injectContract(html: string, slug: string): string {
  const base = appUrl();
  const snippet =
    (base ? `<base href="${base}/">` : "") +
    `<script>window.__MKT_SLUG__=${JSON.stringify(slug)};` +
    `window.__MKT_CAPTURE_URL__=${JSON.stringify(`${base}/api/m/${slug}/capture`)};</script>`;

  const headOpen = html.match(/<head[^>]*>/i);
  if (headOpen && headOpen.index !== undefined) {
    const at = headOpen.index + headOpen[0].length;
    return html.slice(0, at) + snippet + html.slice(at);
  }
  return snippet + html;
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = await getPublishedLanding(slug);
  if (!landing || !landing.code_html?.trim()) notFound();

  const srcDoc = injectContract(landing.code_html, slug);

  return (
    <>
      <ViewBeacon slug={slug} />
      <iframe
        srcDoc={srcDoc}
        title={landing.title || "Landing page"}
        // Full document is admin-authored / Claude-generated. Sandboxed so it
        // runs its own JS and submits its own form without touching the app.
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        className="fixed inset-0 h-full w-full border-0"
      />
    </>
  );
}
