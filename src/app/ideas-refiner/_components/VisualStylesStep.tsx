/**
 * Step 9 — Visual Styles / Design System.
 * Multi-section design system view: brand identity, color system, typography,
 * spacing & layout, elevation, and motion/iconography.
 */
"use client";

import { useState, useEffect } from "react";
import type {
  IdeaFull,
  ColorToken,
  TypographySystem,
  SpacingSystem,
  BorderRadiusSystem,
  ShadowToken,
} from "@/types/idea-refiner";
import { saveStyles, triggerAiGeneration } from "../actions";
import { cn } from "@/lib/utils";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import { useAutoTriggerAi, isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { useRegenerate } from "../_hooks/useRegenerate";

interface VisualStylesStepProps {
  ideaFull: IdeaFull;
}

export default function VisualStylesStep({ ideaFull }: VisualStylesStepProps) {
  const { idea, styles } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "visual_styles";

  // Rich-text fields
  const [logoBranding, setLogoBranding] = useState(styles?.logo_branding ?? "");
  const [colorPalette, setColorPalette] = useState(styles?.color_palette ?? "");
  const [productFeeling, setProductFeeling] = useState(styles?.product_feeling ?? "");
  const [brandVoice, setBrandVoice] = useState(styles?.brand_voice ?? "");
  const [iconographyStyle, setIconographyStyle] = useState(styles?.iconography_style ?? "");
  const [motionPrinciples, setMotionPrinciples] = useState(styles?.motion_principles ?? "");

  // Quick-access color pickers
  const [primaryColor, setPrimaryColor] = useState(styles?.primary_color ?? "#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState(styles?.secondary_color ?? "#8B5CF6");
  const [accentColor, setAccentColor] = useState(styles?.accent_color ?? "#10B981");
  const [neutralColor, setNeutralColor] = useState(styles?.neutral_color ?? "#6B7280");

  const [isSaving, setIsSaving] = useState(false);
  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "visual_styles", isAiWorking);

  useEffect(() => {
    setLogoBranding(styles?.logo_branding ?? "");
    setColorPalette(styles?.color_palette ?? "");
    setProductFeeling(styles?.product_feeling ?? "");
    setBrandVoice(styles?.brand_voice ?? "");
    setIconographyStyle(styles?.iconography_style ?? "");
    setMotionPrinciples(styles?.motion_principles ?? "");
    setPrimaryColor(styles?.primary_color ?? "#3B82F6");
    setSecondaryColor(styles?.secondary_color ?? "#8B5CF6");
    setAccentColor(styles?.accent_color ?? "#10B981");
    setNeutralColor(styles?.neutral_color ?? "#6B7280");
  }, [styles]);

  const isEmpty =
    isBlankHtml(styles?.logo_branding) &&
    isBlankHtml(styles?.color_palette) &&
    isBlankHtml(styles?.product_feeling) &&
    !styles?.primary_color;
  useAutoTriggerAi(idea.id, "visual_styles", isEmpty, isAiWorking);

  const canSave = !isSaving && !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    const result = await saveStyles(idea.id, {
      logo_branding: logoBranding.trim(),
      color_palette: colorPalette.trim(),
      product_feeling: productFeeling.trim(),
      brand_voice: brandVoice.trim(),
      iconography_style: iconographyStyle.trim(),
      motion_principles: motionPrinciples.trim(),
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      neutral_color: neutralColor,
    });

    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "visual_styles"));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="visual_styles" />;
  }

  const colorTokens = styles?.color_tokens as ColorToken[] | null;
  const typography = styles?.typography as TypographySystem | null;
  const spacing = styles?.spacing as SpacingSystem | null;
  const borderRadius = styles?.border_radius as BorderRadiusSystem | null;
  const shadows = styles?.shadows as ShadowToken[] | null;

  return (
    <div className="space-y-8">
      {/* ── Section 1: Brand Identity ──────────────────────────────────────── */}
      <Section title="Brand Identity">
        <Field label="Logo & Branding">
          <RichTextEditor content={logoBranding} onChange={setLogoBranding} editable={!isSaving} />
        </Field>
        <Field label="Brand Voice">
          <RichTextEditor content={brandVoice} onChange={setBrandVoice} editable={!isSaving} />
        </Field>
      </Section>

      {/* ── Section 2: Color System ────────────────────────────────────────── */}
      <Section title="Color System">
        {/* Quick-access color pickers */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Primary", value: primaryColor, onChange: setPrimaryColor },
            { label: "Secondary", value: secondaryColor, onChange: setSecondaryColor },
            { label: "Accent", value: accentColor, onChange: setAccentColor },
            { label: "Neutral", value: neutralColor, onChange: setNeutralColor },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">{label}</span>
              <div className="flex items-center gap-2" suppressHydrationWarning>
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent p-0.5"
                  suppressHydrationWarning
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="flex-1 min-w-0 text-xs font-mono px-2 py-1.5 rounded bg-muted border border-border text-text-primary"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Color tokens grid */}
        {colorTokens && colorTokens.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Color Tokens</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {colorTokens.map((token, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-elevated">
                  <div
                    className="w-10 h-10 rounded-md shrink-0 border border-border/50"
                    style={{ backgroundColor: token.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{token.name}</p>
                    <p className="text-xs text-text-muted font-mono">{token.hex}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{token.role}</p>
                    {token.shades && token.shades.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {token.shades.map((s, j) => (
                          <div
                            key={j}
                            className="w-6 h-6 rounded border border-border/50"
                            style={{ backgroundColor: s.hex }}
                            title={`${s.label}: ${s.hex}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color narrative */}
        <Field label="Color Narrative">
          <RichTextEditor content={colorPalette} onChange={setColorPalette} editable={!isSaving} />
        </Field>
      </Section>

      {/* ── Section 3: Typography ──────────────────────────────────────────── */}
      {typography && (
        <Section title="Typography">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Heading Font", value: typography.heading_font },
              { label: "Body Font", value: typography.body_font },
              { label: "Mono Font", value: typography.mono_font },
            ].filter((f) => f.value).map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs font-medium text-text-secondary">{label}</p>
                <p
                  className="text-base text-text-primary px-3 py-2 rounded-lg border border-border bg-elevated"
                  style={{ fontFamily: `'${value}', sans-serif` }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {typography.scale && typography.scale.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-text-secondary font-medium">Name</th>
                    <th className="text-left py-2 pr-4 text-text-secondary font-medium">Size (px)</th>
                    <th className="text-left py-2 pr-4 text-text-secondary font-medium">Weight</th>
                    <th className="text-left py-2 pr-4 text-text-secondary font-medium">Line Height</th>
                    <th className="text-left py-2 text-text-secondary font-medium">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {typography.scale.map((step, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-text-primary font-medium">{step.name}</td>
                      <td className="py-2 pr-4 text-text-muted font-mono">{step.size_px}</td>
                      <td className="py-2 pr-4 text-text-muted">{step.weight}</td>
                      <td className="py-2 pr-4 text-text-muted">{step.line_height}</td>
                      <td className="py-2 text-text-primary truncate max-w-[200px]" style={{ fontSize: `${Math.min(step.size_px, 20)}px`, fontWeight: step.weight }}>
                        Aa Bb Cc
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* ── Section 4: Spacing & Layout ────────────────────────────────────── */}
      {(spacing || borderRadius) && (
        <Section title="Spacing & Layout">
          {spacing && spacing.scale && spacing.scale.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Spacing Scale (unit: {spacing.unit_px}px)
              </p>
              <div className="flex items-end gap-2 flex-wrap">
                {spacing.scale.map((val, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="bg-accent/40 rounded-sm border border-accent/30"
                      style={{ width: `${Math.min(val * 2, 96)}px`, height: `${Math.min(val, 48)}px` }}
                    />
                    <span className="text-[10px] text-text-muted">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {borderRadius && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Border Radius</p>
              <div className="flex items-center gap-4 flex-wrap">
                {Object.entries(borderRadius).map(([key, val]) => (
                  <div key={key} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-12 h-12 border-2 border-accent/60 bg-accent/10"
                      style={{ borderRadius: val }}
                    />
                    <span className="text-[10px] text-text-muted text-center">
                      <span className="font-medium text-text-secondary">{key}</span>
                      <br />{val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Section 5: Elevation ──────────────────────────────────────────── */}
      {shadows && shadows.length > 0 && (
        <Section title="Elevation">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {shadows.map((shadow, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-elevated border border-border"
                style={{ boxShadow: shadow.css_value }}
              >
                <p className="text-sm font-semibold text-text-primary">{shadow.name}</p>
                <p className="text-xs text-text-muted mt-0.5 font-mono">{shadow.css_value}</p>
                <p className="text-xs text-text-secondary mt-1">{shadow.usage}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Section 6: Motion & Iconography ──────────────────────────────── */}
      <Section title="Motion & Iconography">
        <Field label="Iconography Style">
          <RichTextEditor content={iconographyStyle} onChange={setIconographyStyle} editable={!isSaving} />
        </Field>
        <Field label="Motion Principles">
          <RichTextEditor content={motionPrinciples} onChange={setMotionPrinciples} editable={!isSaving} />
        </Field>
        <Field label="Product Feeling">
          <RichTextEditor content={productFeeling} onChange={setProductFeeling} editable={!isSaving} />
        </Field>
      </Section>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || isSaving}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
            "bg-accent text-white hover:bg-accent/90 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
            "bg-green-600 text-white hover:bg-green-700 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-text-primary border-b border-border pb-2 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-text-primary">{label}</label>
      {children}
    </div>
  );
}
