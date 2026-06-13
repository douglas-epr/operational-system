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
function injectContract(html: string, slug: string, bookingUrl?: string | null): string {
  const base = appUrl();
  // Micro-event tracker: same-origin (allow-same-origin + base href), so it
  // shares the host's sessionStorage session id and reads parent UTM params.
  // Each event type fires at most once per page load; failures are swallowed.
  const tracker = `<script>(function(){
var EV=${JSON.stringify(`${base}/api/m/event`)};var SLUG=${JSON.stringify(slug)};
function sid(){try{var k="mkt_sid",s=sessionStorage.getItem(k);if(!s){s=crypto.randomUUID();sessionStorage.setItem(k,s)}return s}catch(e){return"anon"}}
function utm(){var o={};try{var p=new URLSearchParams(parent.location.search);["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(function(k){var v=p.get(k);if(v)o[k]=v})}catch(e){}return o}
var sent={};
function fire(t){if(sent[t])return;sent[t]=1;var b=JSON.stringify({slug:SLUG,type:t,sessionId:sid(),utm:utm()});try{if(!(navigator.sendBeacon&&navigator.sendBeacon(EV,new Blob([b],{type:"application/json"}))))fetch(EV,{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,body:b}).catch(function(){})}catch(e){}}
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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = await getPublishedLanding(slug);
  if (!landing || !landing.code_html?.trim()) notFound();

  const srcDoc = injectContract(landing.code_html, slug, landing.booking_url);

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
