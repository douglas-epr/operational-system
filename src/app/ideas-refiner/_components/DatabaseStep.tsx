/**
 * Step 8 — Database.
 * Three editable rich-text sections: Tables & Schema, Relationships, Important Notes.
 * Supports AI regeneration and manual save.
 */
"use client";

import { useState, useEffect } from "react";
import type { IdeaFull } from "@/types/idea-refiner";
import { saveDatabase, triggerAiGeneration } from "../actions";
import AiLoadingOverlay from "./AiLoadingOverlay";
import RichTextEditor from "./RichTextEditor.lazy";
import { useRegenerate } from "../_hooks/useRegenerate";
import { createPortal } from "react-dom";
import { useStepActions } from "../_context/StepActionsContext";

interface DatabaseStepProps {
  ideaFull: IdeaFull;
}

export default function DatabaseStep({ ideaFull }: DatabaseStepProps) {
  const { idea, database } = ideaFull;
  const isAiWorking = idea.current_blocks_updating === "database";

  const [tablesSchema, setTablesSchema] = useState(database?.tables_schema ?? "");
  const [relationships, setRelationships] = useState(database?.relationships ?? "");
  const [notes, setNotes] = useState(database?.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const { isRegenerating, error, setError, triggerRegenerate } = useRegenerate(idea.id, "database", isAiWorking);

  useEffect(() => {
    setTablesSchema(database?.tables_schema ?? "");
    setRelationships(database?.relationships ?? "");
    setNotes(database?.notes ?? "");
  }, [database?.tables_schema, database?.relationships, database?.notes]);

  const { actionBarEl, onOpenAiConfig } = useStepActions();

  const canSave =
    (tablesSchema.trim().length > 0 ||
      relationships.trim().length > 0 ||
      notes.trim().length > 0) &&
    !isSaving &&
    !isRegenerating;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);

    const result = await saveDatabase(idea.id, {
      tables_schema: tablesSchema.trim(),
      relationships: relationships.trim(),
      notes: notes.trim(),
    });

    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  function handleRegenerate() {
    return triggerRegenerate(() => triggerAiGeneration(idea.id, "database"));
  }

  if (isAiWorking || isRegenerating) {
    return <AiLoadingOverlay ideaId={idea.id} step="database" />;
  }

  return (
    <div className="space-y-6">
      {/* Tables & Schema */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          Tables & Schema
        </label>
        <RichTextEditor
          content={tablesSchema}
          onChange={setTablesSchema}
          editable={!isSaving && !isRegenerating}
        />
      </div>

      {/* Relationships */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          Relationships
        </label>
        <RichTextEditor
          content={relationships}
          onChange={setRelationships}
          editable={!isSaving && !isRegenerating}
        />
      </div>

      {/* Important Notes */}
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          Important Notes
        </label>
        <RichTextEditor
          content={notes}
          onChange={setNotes}
          editable={!isSaving && !isRegenerating}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {actionBarEl && createPortal(
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onOpenAiConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted border border-border text-text-secondary hover:text-text-primary hover:bg-muted/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Change AI Model
          </button>
        </div>,
        actionBarEl
      )}
    </div>
  );
}
