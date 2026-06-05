/**
 * Public landing page — /m/[slug]
 *
 * Anonymous, SSR. Exempt from the auth gate via the `/m` allowlist in
 * src/proxy.ts. Reads the published landing config with the service-role client
 * (src/lib/marketing/public.ts). Renders hero + sections statically and a
 * client capture form + analytics beacon.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedLanding } from "@/lib/marketing/public";
import type { MktLandingSection } from "@/types/marketing";
import CaptureForm from "./_components/CaptureForm";
import ViewBeacon from "./_components/ViewBeacon";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getPublishedLanding(slug);
  if (!landing) return { title: "Not found" };
  const title = landing.title || landing.hero?.headline || "Join the waitlist";
  return {
    title,
    description: landing.hero?.subheadline ?? undefined,
    robots: { index: false }, // validation pages shouldn't be indexed
  };
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = await getPublishedLanding(slug);
  if (!landing) notFound();

  const hero = landing.hero ?? {};
  const sections = (landing.sections ?? []) as MktLandingSection[];
  const stages = landing.capture_stages ?? [];
  const quizSection = sections.find((s) => s.type === "quiz");

  return (
    <main className="min-h-screen bg-base text-text-primary">
      <ViewBeacon slug={slug} />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        {hero.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.image_url}
            alt=""
            className="mx-auto mb-8 max-h-40 object-contain"
          />
        )}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          {hero.headline || landing.title || "Coming soon"}
        </h1>
        {hero.subheadline && (
          <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto">
            {hero.subheadline}
          </p>
        )}
      </section>

      {/* Capture */}
      <section className="max-w-md mx-auto px-6 pb-16">
        <CaptureForm
          slug={slug}
          stages={stages}
          ctaLabel={hero.cta_label ?? null}
          quizQuestions={
            quizSection?.items?.map((i) => i.title ?? "").filter(Boolean) ?? []
          }
        />
      </section>

      {/* Content sections
          custom_html renders full-width (no container constraint) — it manages its
          own layout, width, and padding. All other section types stay in the
          max-w-3xl centered column. Sections render in their original order. */}
      {sections.filter((s) => s.type !== "quiz").length > 0 && (
        <div className="pb-24">
          {sections
            .filter((s) => s.type !== "quiz")
            .map((s) =>
              s.type === "custom_html" ? (
                // Full-width — no max-w, no px, no vertical margin applied here.
                // The injected HTML owns its own sizing, spacing, and background.
                <Section key={s.id} section={s} />
              ) : (
                // Standard constrained column for builder-rendered section types.
                <div key={s.id} className="max-w-3xl mx-auto px-6 mt-12">
                  <Section section={s} />
                </div>
              )
            )}
        </div>
      )}

      <footer className="border-t border-border py-8 text-center text-xs text-text-muted">
        {landing.project_name || "Move37"} · This is an early validation page.
      </footer>
    </main>
  );
}

/**
 * Strip the most dangerous XSS vectors from admin-authored HTML before
 * injecting it with dangerouslySetInnerHTML. Admin users are trusted but the
 * public page is anonymous, so we remove scripts and event handlers.
 * A full sanitizer (DOMPurify) would need a browser — this runs server-side.
 */
function sanitizeHtml(raw: string): string {
  return raw
    // Remove <script> … </script> blocks (case-insensitive, dotall)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    // Remove event handler attributes: onclick=, onload=, onerror= etc.
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    // Remove javascript: URIs in href/src/action attributes
    .replace(/(?:href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, "");
}

function Section({ section }: { section: MktLandingSection }) {
  if (section.type === "features" && section.items?.length) {
    return (
      <section>
        {section.heading && (
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {section.heading}
          </h2>
        )}
        <div className="grid sm:grid-cols-2 gap-5">
          {section.items.map((it, i) => (
            <div key={i} className="card">
              {it.title && (
                <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                  {it.title}
                </h3>
              )}
              {it.body && (
                <p className="text-sm text-text-secondary">{it.body}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "faq" && section.items?.length) {
    return (
      <section>
        {section.heading && (
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {section.heading}
          </h2>
        )}
        <div className="space-y-4">
          {section.items.map((it, i) => (
            <div key={i} className="border-b border-border pb-4">
              {it.title && (
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                  {it.title}
                </h3>
              )}
              {it.body && (
                <p className="text-sm text-text-secondary">{it.body}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "custom_html" && section.html) {
    // Renders full-width — the parent renders this outside the max-w-3xl container.
    // overflow-hidden prevents any absolute/negative-margin elements from creating
    // horizontal scroll while still allowing the section to span 100vw.
    return (
      <div
        className="w-full overflow-hidden"
        // Content is admin-authored and sanitized server-side (see sanitizeHtml).
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.html) }}
      />
    );
  }

  // Default: text block
  return (
    <section className="text-center">
      {section.heading && (
        <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
      )}
      {section.body && (
        <p className="text-text-secondary whitespace-pre-line">{section.body}</p>
      )}
    </section>
  );
}
