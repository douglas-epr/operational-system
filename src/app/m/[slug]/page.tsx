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
 *   - A micro-event tracker (cta_click / scroll_50 / scroll_90 / pricing_click)
 *     that runs INSIDE the sandboxed document — the host can't see in-iframe
 *     interactions, so the intent gradient must be measured from within.
 * Inserted immediately after the opening <head> tag; if there's no <head>, the
 * snippet is prepended (browsers still execute it).
 */
/** The UTM keys carried from the landing URL into every in-iframe event. */
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/** Pick just the UTM params off this request's query string. */
function pickUtm(searchParams: Record<string, string | string[] | undefined>) {
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const raw = searchParams[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) utm[key] = value.slice(0, 256); // mirrors sanitizeUtm's per-value cap
  }
  return utm;
}

function injectContract(
  html: string,
  slug: string,
  bookingUrl?: string | null,
  utm: Record<string, string> = {},
): string {
  const base = appUrl();
  // Micro-event tracker. Since the S4 sandbox hardening (allow-same-origin
  // removed) the iframe has its own opaque origin: sessionStorage below is
  // scoped to that opaque origin (still fine — it only needs to dedupe events
  // within one page load), and `parent.location.search` is no longer reachable.
  // So the UTM params are resolved on the SERVER from this request's query
  // string and baked into the script as a literal, which is strictly more
  // reliable than the old cross-origin read: no try/catch, no silent loss.
  // Each event type fires at most once per page load; failures are swallowed.
  const tracker = `<script>(function(){
var EV=${JSON.stringify(`${base}/api/m/event`)};var SLUG=${JSON.stringify(slug)};var UTM=${JSON.stringify(utm)};
function sid(){try{var k="mkt_sid",s=sessionStorage.getItem(k);if(!s){s=crypto.randomUUID();sessionStorage.setItem(k,s)}return s}catch(e){return"anon"}}
var sent={};
function fire(t){if(sent[t])return;sent[t]=1;var b=JSON.stringify({slug:SLUG,type:t,sessionId:sid(),utm:UTM});try{if(!(navigator.sendBeacon&&navigator.sendBeacon(EV,new Blob([b],{type:"application/json"}))))fetch(EV,{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,body:b}).catch(function(){})}catch(e){}}
document.addEventListener("scroll",function(){var d=document.documentElement,m=d.scrollHeight-d.clientHeight;if(m<=0)return;var p=d.scrollTop/m;if(p>=.5)fire("scroll_50");if(p>=.9)fire("scroll_90")},{passive:true});
document.addEventListener("click",function(e){var el=e.target&&e.target.closest?e.target.closest("a,button,[type=submit]"):null;if(!el)return;var hay=((el.getAttribute&&(el.getAttribute("href")||""))+" "+(el.id||"")+" "+(el.className&&el.className.toString?el.className.toString():"")+" "+(el.textContent||"")).toLowerCase();if(el.hasAttribute&&el.hasAttribute("data-pricing")||hay.indexOf("pricing")>-1||hay.indexOf("pre-order")>-1||hay.indexOf("preorder")>-1){fire("pricing_click")}else{fire("cta_click")}},true);
})();</script>`;

  const snippet =
    (base ? `<base href="${base}/">` : "") +
    `<script>window.__MKT_SLUG__=${JSON.stringify(slug)};` +
    `window.__MKT_CAPTURE_URL__=${JSON.stringify(`${base}/api/m/${slug}/capture`)};` +
    (bookingUrl ? `window.__MKT_BOOKING_URL__=${JSON.stringify(bookingUrl)};` : "") +
    `</script>` +
    tracker;

  const headOpen = html.match(/<head[^>]*>/i);
  if (headOpen && headOpen.index !== undefined) {
    const at = headOpen.index + headOpen[0].length;
    return html.slice(0, at) + snippet + html.slice(at);
  }
  return snippet + html;
}

export default async function PublicLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const landing = await getPublishedLanding(slug);
  if (!landing || !landing.code_html?.trim()) notFound();

  // Resolved server-side: the sandboxed iframe has an opaque origin and cannot
  // read the parent URL, so attribution has to be injected rather than scraped.
  const utm = pickUtm(await searchParams);
  const srcDoc = injectContract(landing.code_html, slug, landing.booking_url, utm);

  return (
    <>
      <ViewBeacon slug={slug} />
      <iframe
        srcDoc={srcDoc}
        title={landing.title || "Landing page"}
        // Full document is admin-authored / Claude-generated. Sandboxed so it
        // runs its own JS and submits its own form without touching the app.
        // `allow-same-origin` is deliberately NOT set: combined with
        // `allow-scripts` it would let the framed document script reach the
        // parent origin's storage/cookies through the srcDoc's "same
        // document" origin quirk, defeating the sandbox. Without it the
        // iframe gets an opaque origin, so the in-page tracker/capture
        // fetches below arrive at /api/m/* with `Origin: null` — those
        // routes handle that explicitly (CORS + rate limiting).
        sandbox="allow-scripts allow-forms allow-popups"
        className="fixed inset-0 h-full w-full border-0"
      />
    </>
  );
}
