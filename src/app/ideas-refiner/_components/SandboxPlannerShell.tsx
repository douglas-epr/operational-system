/**
 * Client shell for the Sandbox Planner.
 * Manages tab navigation, idea selection state, and renders the appropriate
 * step component based on the active tab.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Idea, IdeaBlock, IdeaFull, ProjectOption } from "@/types/idea-refiner";
import type { UserProfile } from "@/types/projects";
import type { UserAiSettingsClient } from "@/types/settings";
import { IDEA_BLOCK_LABELS, IDEA_BLOCKS_ORDERED, IDEA_BLOCK_STEPS, normalizeTabParam } from "@/types/idea-refiner";
import { cn } from "@/lib/utils";
import { saveAiSettings } from "@/app/settings/actions";
import { registerOpenAiConfigModal } from "../_hooks/aiConfigModalStore";
import IdeasGrid from "./IdeasGrid";
import StructureAlignStep from "./StructureAlignStep";
import RefiningIcpStep from "./RefiningIcpStep";
import ProductDefinitionStep from "./ProductDefinitionStep";
import StrategicFrameworksStep from "./StrategicFrameworksStep";
import LocationLegislationStep from "./LocationLegislationStep";
import MarketOpportunityStep from "./MarketOpportunityStep";
import BenchmarkingStep from "./BenchmarkingStep";
import RiskAndValidationStep from "./RiskAndValidationStep";
import PrdStep from "./PrdStep";
import DatabaseStep from "./DatabaseStep";
import VisualStylesStep from "./VisualStylesStep";
import MilestonesAndTasksStep from "./MilestonesAndTasksStep";
import ReportStep from "./ReportStep";
import PlaybookStep from "./PlaybookStep";
import AiConfigModal from "./AiConfigModal";
import IdeaChatbot from "./IdeaChatbot";
import IdeaDevilAdvocateChatbot from "./IdeaDevilAdvocateChatbot";
import { StepActionsContext } from "../_context/StepActionsContext";

interface SandboxPlannerShellProps {
  ideas: Idea[];
  projects: ProjectOption[];
  profiles: UserProfile[];
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

  // New steps unlock after product definition. Flow order:
  // location_legislation (5) → benchmarking (6) → market_opportunity (7) → strategic_frameworks (8).
  // Each check OR's in later steps' content for backward compat with existing ideas
  // (including those created before benchmarking moved ahead of market_opportunity).
  const benchmarkingHasContent =
    !!ideaFull.benchmarking?.overview?.trim() ||
    !!ideaFull.benchmarking?.comparison?.trim();
  const locationLegislationHasContent =
    !!ideaFull.locationLegislation?.regulatory_bodies?.trim() ||
    !!ideaFull.locationLegislation?.key_legislation?.trim();
  const marketOpportunityHasContent =
    !!ideaFull.marketOpportunity?.tam_description?.trim() ||
    !!ideaFull.marketOpportunity?.tam_estimate?.trim();

  if (productDone || locationLegislationHasContent || benchmarkingHasContent || marketOpportunityHasContent) {
    unlocked.add("location_legislation");
  }
  // Benchmarking (step 6) unlocks after Location & Legislation has content.
  if (locationLegislationHasContent || benchmarkingHasContent || marketOpportunityHasContent) {
    unlocked.add("benchmarking");
  }
  // Market Opportunity (step 7) unlocks after Benchmarking has content — it consumes
  // the competitive/pricing signals from benchmarking to ground its sizing & unit economics.
  if (benchmarkingHasContent || marketOpportunityHasContent) {
    unlocked.add("market_opportunity");
  }

  // Strategic Frameworks (step 8) unlocks after Market Opportunity has content
  // (or benchmarking, for legacy ideas where it was the gate).
  if (marketOpportunityHasContent || benchmarkingHasContent) unlocked.add("strategic_frameworks");

  // Risk & Validation (step 9) comes before Report. Unlocks once Strategic Frameworks
  // has content OR already has data.
  const strategicDone = icps.some(
    (i) => !!i.value_proposition_icp_pains?.trim() || !!i.jtbd?.trim()
  );
  const riskHasContent =
    !!ideaFull.riskAndValidation?.risk_register ||
    !!ideaFull.riskAndValidation?.validation_test;
  if (strategicDone || riskHasContent) unlocked.add("risk_and_validation");

  // Report (step 10) is the go/no-go verdict after risk validation.
  // Backward compat: also unlocks if a report already exists (legacy ideas that pre-date the risk step).
  const reportHasContent =
    ideaFull.report?.final_score != null ||
    !!ideaFull.report?.summary?.trim();
  if (riskHasContent || reportHasContent) unlocked.add("report");

  // PRD is the first build-phase step. Unlocks once Report exists OR PRD already has data.
  const prdHasContent =
    !!ideaFull.prd?.app_overview?.trim() ||
    !!ideaFull.prd?.essential_features?.trim();
  if (reportHasContent || prdHasContent) unlocked.add("prd");

  const prdDone =
    !!ideaFull.prd?.app_overview?.trim() &&
    !!ideaFull.prd?.essential_features?.trim();
  const databaseHasContent = !!ideaFull.database?.tables_schema?.trim();
  if (prdDone || databaseHasContent) unlocked.add("database");

  const databaseDone = !!ideaFull.database?.tables_schema?.trim();
  const stylesHasContent = !!ideaFull.styles?.color_palette?.trim();
  if (databaseDone || stylesHasContent) unlocked.add("visual_styles");

  const stylesDone = !!(
    ideaFull.styles?.color_palette?.trim() ||
    ideaFull.styles?.primary_color?.trim() ||
    ideaFull.styles?.brand_voice?.trim()
  );
  const milestonesHasContent = !!ideaFull.milestonesAndTasks?.content?.trim();
  if (stylesDone || milestonesHasContent) unlocked.add("milestones_and_tasks");

  if (milestonesHasContent || ideaFull.playbookVersions.length > 0) unlocked.add("playbook");

  return unlocked;
}

/** Root client component that orchestrates all sandbox-planner views. */
export default function SandboxPlannerShell({
  ideas,
  projects,
  profiles,
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
  const [actionBarEl, setActionBarEl] = useState<HTMLDivElement | null>(null);

  const unlockedSteps = ideaFull ? computeUnlockedSteps(ideaFull) : new Set<IdeaBlock>(["ideas"]);

  // Register the inline AI config modal opener so useAiWithTimeout can call it
  useEffect(() => {
    registerOpenAiConfigModal(() => setShowAiConfigModal(true));
  }, []);

  // Sync tab from URL; if the tab is locked, navigate to the last unlocked step
  useEffect(() => {
    const tab = normalizeTabParam(searchParams.get("tab")) ?? null;
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
        router.push(`/ideas-refiner${projectId ? `?project=${projectId}` : ""}`);
      } else if (ideaId) {
        router.push(`/ideas-refiner?idea=${ideaId}&tab=${tab}${projectSuffix}`);
      }
    },
    [router, searchParams]
  );

  /** Navigate to an idea's refinement view. */
  const selectIdea = useCallback(
    (ideaId: string) => {
      const projectId = searchParams.get("project");
      const projectSuffix = projectId ? `&project=${projectId}` : "";
      router.push(`/ideas-refiner?idea=${ideaId}&tab=structure_align${projectSuffix}`);
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
          profiles={profiles}
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
        <div className="pt-5 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text-primary">
              {IDEA_BLOCK_LABELS[activeTab]}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Step {stepInfo.step} of {IDEA_BLOCKS_ORDERED.length}. {stepInfo.subtitle}
            </p>
          </div>
          <div ref={setActionBarEl} className="flex items-center gap-2 shrink-0 mt-0.5" />
        </div>
        <StepActionsContext.Provider value={{ actionBarEl, onOpenAiConfig: () => setShowAiConfigModal(true) }}>
        {activeTab === "ideas" && (
          <IdeasGrid
            ideas={ideas}
            projects={projects}
            profiles={profiles}
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
        {activeTab === "location_legislation" && (
          <LocationLegislationStep ideaFull={ideaFull} />
        )}
        {activeTab === "market_opportunity" && (
          <MarketOpportunityStep ideaFull={ideaFull} />
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
        {activeTab === "risk_and_validation" && (
          <RiskAndValidationStep ideaFull={ideaFull} />
        )}
        {activeTab === "playbook" && (
          <PlaybookStep
            ideaFull={ideaFull}
            isAdminOrManager={isAdminOrManager}
            currentUserId={currentUserId}
          />
        )}
        </StepActionsContext.Provider>
      </div>

      {/* Floating chatbots — visible on all 10 refinement tabs */}
      {activeTab !== "ideas" && (
        <>
          <IdeaDevilAdvocateChatbot ideaId={ideaFull.idea.id} currentTab={activeTab} />
          <IdeaChatbot ideaId={ideaFull.idea.id} currentTab={activeTab} />
        </>
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
