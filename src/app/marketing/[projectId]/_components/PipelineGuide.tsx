"use client";

/**
 * PipelineGuide — horizontal numbered stepper showing the 6 funnel steps.
 * Circles connected by lines; done steps show a checkmark; the next action
 * is highlighted in accent. Each circle links to its target page.
 */

import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons";

export interface PipelineStep {
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

export default function PipelineGuide({ steps }: { steps: PipelineStep[] }) {
  const nextIndex = steps.findIndex((s) => !s.done);
  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading-3 text-text-primary">Getting started</h2>
        <span className="text-xs text-text-muted">
          {completed} of {steps.length} done
        </span>
      </div>

      {/* Stepper row */}
      <div className="flex items-start">
        {steps.map((step, i) => {
          const isNext = i === nextIndex;
          const isDone = step.done;

          return (
            <div key={step.label} className="flex-1 flex flex-col items-center min-w-0">
              {/* Connector row: left line + circle + right line */}
              <div className="relative w-full flex items-center">
                {/* Left connector */}
                <div
                  className={[
                    "flex-1 h-0.5",
                    i === 0 ? "invisible" : isDone ? "bg-[color:var(--success-strong)]" : "bg-border",
                  ].join(" ")}
                />

                {/* Circle */}
                <Link
                  href={step.href}
                  className={[
                    "shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all",
                    isDone
                      ? "bg-[color:var(--success-strong)] text-white"
                      : isNext
                      ? "bg-accent text-white ring-4 ring-accent/20"
                      : "bg-muted text-text-muted hover:bg-accent/20 hover:text-accent",
                  ].join(" ")}
                  title={step.label}
                >
                  {isDone ? (
                    <CheckIcon className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </Link>

                {/* Right connector */}
                <div
                  className={[
                    "flex-1 h-0.5",
                    i === steps.length - 1
                      ? "invisible"
                      : isDone && steps[i + 1]?.done
                      ? "bg-[color:var(--success-strong)]"
                      : isDone
                      ? "bg-border"
                      : "bg-border",
                  ].join(" ")}
                />
              </div>

              {/* Label + hint below circle */}
              <div className="mt-3 text-center px-1 max-w-[110px]">
                <Link
                  href={step.href}
                  className={[
                    "text-xs font-semibold leading-snug hover:text-accent transition-colors",
                    isDone
                      ? "text-text-muted line-through decoration-text-muted/40"
                      : isNext
                      ? "text-accent"
                      : "text-text-secondary",
                  ].join(" ")}
                >
                  {step.label}
                </Link>
                {isNext && (
                  <p className="mt-0.5 text-[10px] text-text-muted leading-tight">
                    {step.hint}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
