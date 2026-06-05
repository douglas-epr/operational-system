/**
 * PromptsShell — client component for managing AI prompt templates.
 * Each prompt_group is shown as a card with an editable group name.
 * Inside the card, each prompt has an editable name and description textarea.
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/app/sandbox-planner/_components/RichTextEditor";
import {
  updatePromptGroupName,
  updatePromptName,
  updatePromptDescription,
} from "../actions";
import type { PromptGroupRow, PromptRow } from "../actions";

interface PromptsShellProps {
  groups: PromptGroupRow[];
}

export default function PromptsShell({ groups }: PromptsShellProps) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const filtered = groups
    .filter((g) => selectedGroup === "all" || g.id === Number(selectedGroup))
    .map((g) => {
      if (!search.trim()) return g;
      const q = search.toLowerCase();
      // Keep only prompts whose name or description contains the query
      const matchingPrompts = g.prompts.filter(
        (p) =>
          (p.name ?? "").toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
      // Also keep the whole group if the group name matches
      if (g.name.toLowerCase().includes(q)) return g;
      if (matchingPrompts.length === 0) return null;
      return { ...g, prompts: matchingPrompts };
    })
    .filter(Boolean) as PromptGroupRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI Prompt Templates</h1>
        <p className="text-sm text-text-muted mt-1">
          Edit the AI prompts used to generate each step. Use{" "}
          <code className="bg-muted px-1 rounded text-xs">{"{{variable}}"}</code>{" "}
          placeholders that will be replaced with real data at generation time.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Group dropdown */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-3 py-2 bg-elevated border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={String(g.id)}>{g.name}</option>
          ))}
        </select>

        {/* Name search */}
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or content…"
            className="w-full pl-9 pr-3 py-2 bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {(search || selectedGroup !== "all") && (
          <span className="text-xs text-text-muted">
            {filtered.reduce((n, g) => n + g.prompts.length, 0)} prompt{filtered.reduce((n, g) => n + g.prompts.length, 0) !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {filtered.map((group) => (
        <PromptGroupCard key={group.id} group={group} />
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          {groups.length === 0 ? "No prompt groups found." : "No prompts match your search."}
        </div>
      )}
    </div>
  );
}

function PromptGroupCard({ group }: { group: PromptGroupRow }) {
  const [groupName, setGroupName] = useState(group.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const nameChanged = groupName.trim() !== group.name;

  async function handleSaveName() {
    if (!nameChanged || isSavingName) return;
    setIsSavingName(true);
    setNameError(null);
    const result = await updatePromptGroupName(group.id, groupName.trim());
    setIsSavingName(false);
    if (result.error) setNameError(result.error);
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Group header — editable group name */}
      <div className="px-5 py-4 border-b border-border bg-elevated flex items-center gap-3">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
          className={cn(
            "flex-1 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold",
            "bg-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          )}
        />
        {nameChanged && (
          <button
            onClick={handleSaveName}
            disabled={isSavingName}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-white",
              "hover:bg-accent/90 transition-colors disabled:opacity-50 shrink-0"
            )}
          >
            {isSavingName ? "Saving..." : "Save"}
          </button>
        )}
      </div>

      {nameError && (
        <p className="px-5 pt-2 text-xs text-red-400" role="alert">{nameError}</p>
      )}

      {/* Prompt cards */}
      <div className="divide-y divide-border">
        {group.prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}

        {group.prompts.length === 0 && (
          <p className="px-5 py-6 text-sm text-text-muted italic">
            No prompts in this group yet.
          </p>
        )}
      </div>
    </div>
  );
}

function PromptCard({ prompt }: { prompt: PromptRow }) {
  const [name, setName] = useState(prompt.name ?? "");
  const [description, setDescription] = useState(prompt.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    setSaved(false);

    const [nameRes, descRes] = await Promise.all([
      name.trim() !== (prompt.name ?? "")
        ? updatePromptName(prompt.id, name.trim())
        : Promise.resolve({}),
      description !== (prompt.description ?? "")
        ? updatePromptDescription(prompt.id, description)
        : Promise.resolve({}),
    ]);

    setIsSaving(false);

    const err = (nameRes as { error?: string }).error ?? (descRes as { error?: string }).error;
    if (err) {
      setError(err);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="px-5 py-5 space-y-4">
      {/* Prompt Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          disabled={isSaving}
          className={cn(
            "w-full rounded-lg border border-border px-3 py-2 text-sm font-medium",
            "bg-base text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
            "disabled:opacity-50"
          )}
        />
      </div>

      {/* Prompt Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide">
          Description
        </label>
        <RichTextEditor
          content={description}
          onChange={(html) => { setDescription(html); setSaved(false); }}
          editable={!isSaving}
          placeholder="Prompt description..."
          minHeight="min-h-64"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400" role="alert">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-green-600 text-white hover:bg-green-700 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {isSaving ? "Saving..." : "Save Prompt"}
        </button>
      </div>
    </div>
  );
}
