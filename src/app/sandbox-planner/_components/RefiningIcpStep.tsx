/**
 * Step 3 — Refining ICPs.
 * Shows ICP pills at top with add/edit/delete actions.
 * Per-ICP editable fields: Description, Day in the Life, Pain Points,
 * How problems are solved currently, How problems could be solved,
 * and Our Solution Value.
 * Left column shows readonly idea context; right column shows editable ICP fields.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaIcp, IdeaFull } from "@/types/sandbox-planner";
import { saveIcpProfile, triggerAiGeneration, createIcp, deleteIcp } from "../actions";
import { cn } from "@/lib/utils";
import IcpPillSelector from "./IcpPillSelector";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor";
import { useAutoTriggerAi, clearAutoTriggerGuard, isBlankHtml } from "../_hooks/useAutoTriggerAi";
import { runAiWithTimeout } from "../_hooks/useAiWithTimeout";

interface RefiningIcpStepProps {
  ideaFull: IdeaFull;
}

export default function RefiningIcpStep({ ideaFull }: RefiningIcpStepProps) {
  const { idea, structureAlign, icps } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "refining_icp";

  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(
    icps[0]?.id ?? null
  );
  const [description, setDescription] = useState("");
  const [dayInLife, setDayInLife] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [howSolved, setHowSolved] = useState("");
  const [howCouldBeSolved, setHowCouldBeSolved] = useState("");
  const [ourSolutionValue, setOurSolutionValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ICP modal state — create mode only (no description field in modal)
  const [icpModal, setIcpModal] = useState<{ mode: "create" | "edit"; icp?: IdeaIcp } | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalDayInLife, setModalDayInLife] = useState("");
  const [modalPainPoints, setModalPainPoints] = useState("");
  const [modalHowSolved, setModalHowSolved] = useState("");
  const [modalHowCouldBeSolved, setModalHowCouldBeSolved] = useState("");
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const selectedIcp = icps.find((i) => i.id === selectedIcpId) ?? null;

  // Sync selected ICP when icps list changes (e.g. after AI regeneration)
  useEffect(() => {
    setSelectedIcpId((prev) =>
      icps.find((i) => i.id === prev) ? prev : (icps[0]?.id ?? null)
    );
  }, [icps]);

  // Sync fields when selected ICP changes
  useEffect(() => {
    if (selectedIcp) {
      setDescription(selectedIcp.description ?? "");
      setDayInLife(selectedIcp.day_in_life ?? "");
      setPainPoints(selectedIcp.pain_points ?? "");
      setHowSolved(selectedIcp.how_problems_are_solved ?? "");
      setHowCouldBeSolved(selectedIcp.how_problems_could_be_solved ?? "");
      setOurSolutionValue(selectedIcp.our_solution_value ?? "");
    } else {
      setDescription("");
      setDayInLife("");
      setPainPoints("");
      setHowSolved("");
      setHowCouldBeSolved("");
      setOurSolutionValue("");
    }
  }, [selectedIcp]);

  // Auto-trigger AI the first time the Refining ICP step is opened and there
  // are no ICPs yet.
  useAutoTriggerAi(idea.id, "refining_icp", icps.length === 0, isAiWorking);

  const canSave =
    !isBlankHtml(dayInLife) &&
    !isBlankHtml(painPoints) &&
    !!selectedIcpId &&
    !isSaving &&
    !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    const result = await saveIcpProfile(selectedIcpId, {
      description: description || null,
      day_in_life: dayInLife,
      pain_points: painPoints,
      how_problems_are_solved: howSolved,
      how_problems_could_be_solved: howCouldBeSolved,
      our_solution_value: ourSolutionValue || null,
    });
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    clearAutoTriggerGuard(idea.id, "refining_icp");
    const result = await runAiWithTimeout(() =>
      triggerAiGeneration(idea.id, "refining_icp", selectedIcpId ?? undefined)
    );
    setIsRegenerating(false);
    if (result.error) setError(result.error);
  }

  function openCreateModal() {
    setModalName("");
    setModalDayInLife("");
    setModalPainPoints("");
    setModalHowSolved("");
    setModalHowCouldBeSolved("");
    setModalError(null);
    setIcpModal({ mode: "create" });
  }

  function openEditModal(icp: IdeaIcp) {
    setModalName(icp.name ?? "");
    setModalDayInLife(icp.day_in_life ?? "");
    setModalPainPoints(icp.pain_points ?? "");
    setModalHowSolved(icp.how_problems_are_solved ?? "");
    setModalHowCouldBeSolved(icp.how_problems_could_be_solved ?? "");
    setModalError(null);
    setIcpModal({ mode: "edit", icp });
  }

  function closeModal() {
    setIcpModal(null);
    setModalName("");
    setModalDayInLife("");
    setModalPainPoints("");
    setModalHowSolved("");
    setModalHowCouldBeSolved("");
    setModalError(null);
  }

  async function handleModalSubmit() {
    if (!modalName.trim()) {
      setModalError("Name is required.");
      return;
    }
    setIsModalSaving(true);
    setModalError(null);

    if (icpModal?.mode === "create") {
      const createResult = await createIcp(idea.id, {
        name: modalName.trim(),
      });
      if (createResult.error || !createResult.id) {
        setIsModalSaving(false);
        setModalError(createResult.error ?? "Failed to create ICP");
        return;
      }
      // Persist the rich-text fields against the newly created ICP
      const saveResult = await saveIcpProfile(createResult.id, {
        day_in_life: modalDayInLife || null,
        pain_points: modalPainPoints || null,
        how_problems_are_solved: modalHowSolved || null,
        how_problems_could_be_solved: modalHowCouldBeSolved || null,
      });
      setIsModalSaving(false);
      if (saveResult.error) { setModalError(saveResult.error); return; }
      setSelectedIcpId(createResult.id);
    } else if (icpModal?.mode === "edit" && icpModal.icp) {
      const result = await saveIcpProfile(icpModal.icp.id, {
        name: modalName.trim(),
        day_in_life: modalDayInLife || null,
        pain_points: modalPainPoints || null,
        how_problems_are_solved: modalHowSolved || null,
        how_problems_could_be_solved: modalHowCouldBeSolved || null,
      });
      setIsModalSaving(false);
      if (result.error) { setModalError(result.error); return; }
    }

    closeModal();
  }

  async function handleDeleteIcp(icpId: string) {
    const result = await deleteIcp(icpId);
    if (result.error) setError(result.error);
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="refining_icp" />;
  }

  if (icps.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          No ICPs have been generated yet. Run AI on the Structure &amp; Align step first,
          then regenerate ICPs here.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
              "bg-accent text-white hover:bg-accent/90 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              "disabled:opacity-50"
            )}
          >
            {isRegenerating ? "Generating..." : "Generate ICPs"}
          </button>
          <button
            onClick={openCreateModal}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
              "bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add ICP manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ICP pills with edit/delete/add */}
      <IcpPillSelector
        icps={icps}
        selectedId={selectedIcpId}
        onSelect={setSelectedIcpId}
        onAdd={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDeleteIcp}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Readonly context */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Original Idea*
            </h3>
            <div
              className="tiptap-content rounded-lg border border-border bg-surface p-4 prose prose-sm prose-invert max-w-none text-sm text-text-secondary"
              dangerouslySetInnerHTML={{ __html: idea.description ?? "<p>No description provided.</p>" }}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Finalized Core Problem*
            </h3>
            <div
              className="tiptap-content rounded-lg border border-border bg-surface p-4 prose prose-sm prose-invert max-w-none text-sm text-text-secondary"
              dangerouslySetInnerHTML={{ __html: structureAlign?.core_problem ?? "<p>Not defined yet. Complete the Structure &amp; Align step first.</p>" }}
            />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Instructions
            </h3>
            <p className="text-xs text-text-muted mb-2">
              This step is about humanizing your target audience. We need to move
              beyond demographics and understand their daily reality.
            </p>
            <p className="text-xs text-text-muted mb-1">
              Ensure the product solves a <strong>real, urgent need</strong>, not
              just a minor inconvenience.
            </p>
            <ul className="text-xs text-text-muted list-disc list-inside space-y-0.5">
              <li>Identify specific friction points.</li>
              <li>Validate willingness to pay.</li>
            </ul>
          </div>
        </div>

        {/* Right column — Editable fields */}
        <div className="space-y-5">

          {/* Description — moved from modal to main page */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Description
            </label>
            <p className="text-xs text-text-muted mb-2">
              Brief profile of who this ICP is.
            </p>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              editable={!isSaving && !isRegenerating && !!selectedIcp}
              placeholder="Describe who this persona is..."
              minHeight="min-h-28"
            />
          </div>

          <div>
            <label
              htmlFor="day-in-life"
              className="block text-sm font-semibold text-text-primary mb-1.5"
            >
              Day in the Life (ROLES &amp; CONTEXT)*
            </label>
            <RichTextEditor
              content={dayInLife}
              onChange={setDayInLife}
              editable={!isSaving && !isRegenerating && !!selectedIcp}
              placeholder="Describe the daily reality, roles, and context for this persona..."
              minHeight="min-h-40"
            />
          </div>

          <div>
            <label
              htmlFor="pain-points"
              className="block text-sm font-semibold text-text-primary mb-1.5"
            >
              Pain Points &amp; Acute Needs (FRICTION &amp; IMPACT)*
            </label>
            <RichTextEditor
              content={painPoints}
              onChange={setPainPoints}
              editable={!isSaving && !isRegenerating && !!selectedIcp}
              placeholder="Describe key pain points, friction, and urgent needs..."
              minHeight="min-h-40"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              How this ICP solves their problems currently
            </label>
            <p className="text-xs text-text-muted mb-2">
              Tools, services, workarounds, and compromises they rely on today.
            </p>
            <RichTextEditor
              content={howSolved}
              onChange={setHowSolved}
              editable={!isSaving && !isRegenerating && !!selectedIcp}
              placeholder="How do they solve these problems today (tools, workarounds)?"
              minHeight="min-h-40"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              How this ICP could solve their problems
            </label>
            <p className="text-xs text-text-muted mb-2">
              All plausible ways — existing tools, alternative workflows, emerging tech,
              DIY approaches, and finally where our product could fit in. This is a
              landscape survey, not a pitch for our product.
            </p>
            <RichTextEditor
              content={howCouldBeSolved}
              onChange={setHowCouldBeSolved}
              editable={!isSaving && !isRegenerating && !!selectedIcp}
              placeholder="What are all the possible ways these problems could be solved?"
              minHeight="min-h-40"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Our Solution Value
            </label>
            <p className="text-xs text-text-muted mb-2">
              Specifically what value our product brings to this ICP — tied to their acute
              pain points, not generic benefits.
            </p>
            <RichTextEditor
              content={ourSolutionValue}
              onChange={setOurSolutionValue}
              editable={!isSaving && !isRegenerating && !!selectedIcp}
              placeholder="What specific value does our solution provide to this ICP?"
              minHeight="min-h-40"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">{error}</p>
          )}

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
      </div>

      {/* ── Create / Edit ICP Modal ─────────────────────────────────────────── */}
      {icpModal && (
        <IcpModal
          mode={icpModal.mode}
          name={modalName}
          dayInLife={modalDayInLife}
          painPoints={modalPainPoints}
          howSolved={modalHowSolved}
          howCouldBeSolved={modalHowCouldBeSolved}
          onNameChange={setModalName}
          onDayInLifeChange={setModalDayInLife}
          onPainPointsChange={setModalPainPoints}
          onHowSolvedChange={setModalHowSolved}
          onHowCouldBeSolvedChange={setModalHowCouldBeSolved}
          onSubmit={handleModalSubmit}
          onClose={closeModal}
          isSaving={isModalSaving}
          error={modalError}
        />
      )}
    </div>
  );
}

// ── ICP Create / Edit Modal ───────────────────────────────────────────────────

interface IcpModalProps {
  mode: "create" | "edit";
  name: string;
  dayInLife: string;
  painPoints: string;
  howSolved: string;
  howCouldBeSolved: string;
  onNameChange: (v: string) => void;
  onDayInLifeChange: (v: string) => void;
  onPainPointsChange: (v: string) => void;
  onHowSolvedChange: (v: string) => void;
  onHowCouldBeSolvedChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSaving: boolean;
  error: string | null;
}

function IcpModal({
  mode,
  name,
  dayInLife,
  painPoints,
  howSolved,
  howCouldBeSolved,
  onNameChange,
  onDayInLifeChange,
  onPainPointsChange,
  onHowSolvedChange,
  onHowCouldBeSolvedChange,
  onSubmit,
  onClose,
  isSaving,
  error,
}: IcpModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 overflow-y-auto py-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-950 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6">
          <h2 className="text-2xl font-bold text-white">
            {mode === "create" ? "Create ICP" : "Edit ICP"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors focus-visible:outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Name*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="Name here..."
              autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Day in the Life
            </label>
            <RichTextEditor
              content={dayInLife}
              onChange={onDayInLifeChange}
              placeholder="Describe the daily reality, roles, and context..."
              minHeight="min-h-28"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Pain Points &amp; Acute Needs
            </label>
            <RichTextEditor
              content={painPoints}
              onChange={onPainPointsChange}
              placeholder="Describe key pain points, friction, and urgent needs..."
              minHeight="min-h-28"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              How this ICP solves their problems currently
            </label>
            <RichTextEditor
              content={howSolved}
              onChange={onHowSolvedChange}
              placeholder="Tools, services, workarounds, and compromises they rely on today..."
              minHeight="min-h-28"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              How this ICP could solve their problems
            </label>
            <RichTextEditor
              content={howCouldBeSolved}
              onChange={onHowCouldBeSolvedChange}
              placeholder="All plausible ways — tools, services, workflows, emerging approaches (not limited to our product)..."
              minHeight="min-h-28"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 pt-6 pb-8 mt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors focus-visible:outline-none"
          >
            Close
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white transition-colors",
              "bg-accent hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSaving ? "Saving..." : mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
