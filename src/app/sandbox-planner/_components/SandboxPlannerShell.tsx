/**
 * Client shell for the Sandbox Planner.
 * Manages tab navigation, idea selection state, and renders the appropriate
 * step component based on the active tab.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Idea, IdeaBlock, IdeaFull, ProjectOption } from "@/types/sandbox-planner";
import type { UserAiSettingsClient } from "@/types/settings";
import { IDEA_BLOCK_LABELS, IDEA_BLOCKS_ORDERED, IDEA_BLOCK_STEPS } from "@/types/sandbox-planner";
import { cn } from "@/lib/utils";
import { saveAiSettings } from "@/app/settings/actions";
import { registerOpenAiConfigModal } from "../_hooks/aiConfigModalStore";
import IdeasGrid from "./IdeasGrid";
import StructureAlignStep from "./StructureAlignStep";
import RefiningIcpStep from "./RefiningIcpStep";
import ProductDefinitionStep from "./ProductDefinitionStep";
import StrategicFrameworksStep from "./StrategicFrameworksStep";
import BenchmarkingStep from "./BenchmarkingStep";
import PrdStep from "./PrdStep";
import DatabaseStep from "./DatabaseStep";
import VisualStylesStep from "./VisualStylesStep";
import MilestonesAndTasksStep from "./MilestonesAndTasksStep";
import ReportStep from "./ReportStep";
import AiConfigModal from "./AiConfigModal";
import IdeaChatbot from "./IdeaChatbot";

interface SandboxPlannerShellProps {
  ideas: Idea[];
  projects: ProjectOption[];
  ideaFull: IdeaFull | null;
  initialTab: IdeaBlock;
  userName: string;
  currentUserId: string;
  isAdminOrManager: boolean;
  selectedProjectId: string | null;
  hasAiConfigured: boolean;
  aiSettings: UserAiSettingsClient;
}

/** Derive which steps are unlocked based on saved data in ideaFull. */
function computeUnlockedSteps(ideaFull: IdeaFull): Set<IdeaBlock> {
  const unlocked = new Set<IdeaBlock>(["ideas", "structure_align"]);
  const { structureAlign, icps, productDefinition } = ideaFull;

  const structureDone =
    !!structureAlign?.core_problem?.trim() &&
    !!structureAlign?.target_audience?.trim() &&
    !!structureAlign?.success_metrics?.trim();

  if (structureDone) unlocked.add("refining_icp");

  const icpsDone =
    icps.length > 0 &&
    icps.every((i) => i.day_in_life?.trim() && i.pain_points?.trim());

  if (icpsDone) unlocked.add("product_definition_flows");

  const productDone =
    !!productDefinition?.summary?.trim() &&
    !!productDefinition?.features?.trim();

  // Step 5 is now Benchmarking (was Strategic Frameworks)
  if (productDone) unlocked.add("benchmarking");

  // Step 6 is now Strategic Frameworks — unlocks after Benchmarking has content
  const benchmarkingDone =
    !!ideaFull.benchmarking?.overview?.trim() ||
    !!ideaFull.benchmarking?.comparison?.trim();
  if (benchmarkingDone) unlocked.add("strategic_frameworks");

  // PRD unlocks after Strategic Frameworks has content OR if PRD already has its own data
  // (Regenerating an upstream step — e.g. Refining ICP — must NOT lock a downstream step
  // that has already been generated and saved to its own table.)
  const strategicDone = icps.some(
    (i) => !!i.value_proposition_icp_pains?.trim() || !!i.jtbd?.trim()
  );
  const prdHasContent =
    !!ideaFull.prd?.app_overview?.trim() ||
    !!ideaFull.prd?.essential_features?.trim();
  if (strategicDone || prdHasContent) unlocked.add("prd");

  const prdDone =
    !!ideaFull.prd?.app_overview?.trim() &&
    !!ideaFull.prd?.essential_features?.trim();
  const databaseHasContent = !!ideaFull.database?.tables_schema?.trim();
  if (prdDone || databaseHasContent) unlocked.add("database");

  const databaseDone = !!ideaFull.database?.tables_schema?.trim();
  const stylesHasContent = !!ideaFull.styles?.color_palette?.trim();
  if (databaseDone || stylesHasContent) unlocked.add("visual_styles");

  const stylesDone = !!ideaFull.styles?.color_palette?.trim();
  const milestonesHasContent = !!ideaFull.milestonesAndTasks?.content?.trim();
  if (stylesDone || milestonesHasContent) unlocked.add("milestones_and_tasks");

  // Report unlocks once milestones have any content OR if a report already exists
  const milestonesDone = !!ideaFull.milestonesAndTasks?.content?.trim();
  const reportHasContent =
    ideaFull.report?.final_score != null ||
    !!ideaFull.report?.summary?.trim();
  if (milestonesDone || reportHasContent) unlocked.add("report");

  return unlocked;
}

/** Root client component that orchestrates all sandbox-planner views. */
export default function SandboxPlannerShell({
  ideas,
  projects,
  ideaFull,
  initialTab,
  userName,
  currentUserId,
  isAdminOrManager,
  selectedProjectId,
  hasAiConfigured,
  aiSettings,
}: SandboxPlannerShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<IdeaBlock>(initialTab);
  const [showAiConfigModal, setShowAiConfigModal] = useState(false);

  const unlockedSteps = ideaFull ? computeUnlockedSteps(ideaFull) : new Set<IdeaBlock>(["ideas"]);

  // Register the inline AI config modal opener so useAiWithTimeout can call it
  useEffect(() => {
    registerOpenAiConfigModal(() => setShowAiConfigModal(true));
  }, []);

  // Sync tab from URL; if the tab is locked, navigate to the last unlocked step
  useEffect(() => {
    const tab = searchParams.get("tab") as IdeaBlock | null;
    if (tab && IDEA_BLOCKS_ORDERED.includes(tab)) {
      if (ideaFull && !unlockedSteps.has(tab)) {
        // Find the last unlocked step
        const lastUnlocked = IDEA_BLOCKS_ORDERED.filter((b) => unlockedSteps.has(b)).at(-1);
        if (lastUnlocked) navigateTab(lastUnlocked);
      } else {
        setActiveTab(tab);
      }
    } else if (!searchParams.get("idea")) {
      setActiveTab("ideas");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Subscribe to realtime idea updates for AI polling
  useEffect(() => {
    if (!ideaFull) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`idea-${ideaFull.idea.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "idea",
          filter: `id=eq.${ideaFull.idea.id}`,
        },
        (payload) => {
          const updated = payload.new as { current_blocks_updating: string | null };
          if (!updated.current_blocks_updating) {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ideaFull, router]);

  /** Navigate to a tab, preserving the selected idea and project in the URL. */
  const navigateTab = useCallback(
    (tab: IdeaBlock) => {
      const ideaId = searchParams.get("idea");
      const projectId = searchParams.get("project");
      const projectSuffix = projectId ? `&project=${projectId}` : "";
      if (tab === "ideas") {
        router.push(`/sandbox-planner${projectId ? `?project=${projectId}` : ""}`);
      } else if (ideaId) {
        router.push(`/sandbox-planner?idea=${ideaId}&tab=${tab}${projectSuffix}`);
      }
    },
    [router, searchParams]
  );

  /** Navigate to an idea's refinement view. */
  const selectIdea = useCallback(
    (ideaId: string) => {
      const projectId = searchParams.get("project");
      const projectSuffix = projectId ? `&project=${projectId}` : "";
      router.push(`/sandbox-planner?idea=${ideaId}&tab=structure_align${projectSuffix}`);
    },
    [router, searchParams]
  );

  // If no idea selected, show the ideas grid
  if (!ideaFull) {
    return (
      <>
        <IdeasGrid
          ideas={ideas}
          projects={projects}
          userName={userName}
          currentUserId={currentUserId}
          isAdminOrManager={isAdminOrManager}
          onSelectIdea={selectIdea}
          selectedProjectId={selectedProjectId}
          hasAiConfigured={hasAiConfigured}
          aiSettings={aiSettings}
        />
        <AiConfigModal
          isOpen={showAiConfigModal}
          onClose={() => setShowAiConfigModal(false)}
          aiSettings={aiSettings}
          onSave={saveAiSettings}
        />
      </>
    );
  }

  // Idea selected — show breadcrumb navigation + step content
  const stepInfo = IDEA_BLOCK_STEPS[activeTab];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumb tab navigation */}
      <div className="shrink-0 border-b border-border bg-surface px-6 pt-4 pb-0">
        <div className="overflow-x-auto mb-2 scrollbar-thin-x pb-2">
          <div className="inline-flex items-center gap-1 bg-surface/80 rounded-full px-3 py-1.5 border border-border whitespace-nowrap min-w-max">
            {IDEA_BLOCKS_ORDERED.map((block, index) => {
              const isActive = activeTab === block;
              const isUnlocked = unlockedSteps.has(block);
              const isLast = index === IDEA_BLOCKS_ORDERED.length - 1;

              return (
                <span key={block} className="flex items-center gap-1">
                  <button
                    onClick={() => isUnlocked && navigateTab(block)}
                    disabled={!isUnlocked}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                      isActive
                        ? "bg-white text-gray-900 font-semibold shadow-sm"
                        : isUnlocked
                        ? "text-text-secondary hover:text-text-primary cursor-pointer"
                        : "text-text-muted opacity-40 cursor-not-allowed"
                    )}
                  >
                    {IDEA_BLOCK_LABELS[block]}
                  </button>
                  {!isLast && (
                    <span className="text-text-muted text-xs select-none">›</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content — title scrolls with content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="pt-5 pb-4">
          <h1 className="text-xl font-bold text-text-primary">
            {IDEA_BLOCK_LABELS[activeTab]}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Step {stepInfo.step} of 11. {stepInfo.subtitle}
          </p>
        </div>
        {activeTab === "ideas" && (
          <IdeasGrid
            ideas={ideas}
            projects={projects}
            userName={userName}
            currentUserId={currentUserId}
            isAdminOrManager={isAdminOrManager}
            onSelectIdea={selectIdea}
            selectedProjectId={selectedProjectId}
            hasAiConfigured={hasAiConfigured}
            aiSettings={aiSettings}
          />
        )}
        {activeTab === "structure_align" && (
          <StructureAlignStep ideaFull={ideaFull} />
        )}
        {activeTab === "refining_icp" && (
          <RefiningIcpStep ideaFull={ideaFull} />
        )}
        {activeTab === "product_definition_flows" && (
          <ProductDefinitionStep ideaFull={ideaFull} />
        )}
        {activeTab === "benchmarking" && (
          <BenchmarkingStep ideaFull={ideaFull} />
        )}
        {activeTab === "strategic_frameworks" && (
          <StrategicFrameworksStep ideaFull={ideaFull} />
        )}
        {activeTab === "prd" && (
          <PrdStep ideaFull={ideaFull} />
        )}
        {activeTab === "database" && (
          <DatabaseStep ideaFull={ideaFull} />
        )}
        {activeTab === "visual_styles" && (
          <VisualStylesStep ideaFull={ideaFull} />
        )}
        {activeTab === "milestones_and_tasks" && (
          <MilestonesAndTasksStep ideaFull={ideaFull} />
        )}
        {activeTab === "report" && (
          <ReportStep ideaFull={ideaFull} />
        )}
      </div>

      {/* Floating Idea Chatbot — visible on all 10 refinement tabs */}
      {activeTab !== "ideas" && (
        <IdeaChatbot ideaId={ideaFull.idea.id} currentTab={activeTab} />
      )}

      {/* Inline AI config modal — opened by timeout/error toasts */}
      <AiConfigModal
        isOpen={showAiConfigModal}
        onClose={() => setShowAiConfigModal(false)}
        aiSettings={aiSettings}
        onSave={saveAiSettings}
      />
    </div>
  );
}
