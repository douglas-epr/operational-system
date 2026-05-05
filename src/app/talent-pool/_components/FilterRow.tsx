"use client";

/**
 * Collapsible filter row — 7 multi-selects.
 * Toggled by the settings icon next to the search input in TalentPoolShell.
 */

import {
  TOOL_LABELS,
  PROGRAMMING_LANGUAGE_LABELS,
  COUNTRIES,
} from "@/types/talent";
import { TALENT_LEVEL_LABELS, TALENT_AUTHORITY_LEVEL_LABELS } from "@/types/projects";
import MultiChipSelect from "./MultiChipSelect";

export interface Filters {
  levels: string[];
  authorityLevels: string[];
  tools: string[];
  languages: string[];
  recommenderLevels: string[];
  countries: string[];
  companyIds: string[];
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  companies: { id: string; name: string }[];
}

export default function FilterRow({ filters, onChange, companies }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
      <MultiChipSelect
        label="Level"
        options={Object.entries(TALENT_LEVEL_LABELS).map(([value, label]) => ({ value, label }))}
        values={filters.levels}
        onChange={(v) => onChange({ ...filters, levels: v })}
      />
      <MultiChipSelect
        label="Authority Level"
        options={Object.entries(TALENT_AUTHORITY_LEVEL_LABELS).map(([value, label]) => ({ value, label }))}
        values={filters.authorityLevels}
        onChange={(v) => onChange({ ...filters, authorityLevels: v })}
      />
      <MultiChipSelect
        label="Tools"
        options={Object.entries(TOOL_LABELS).map(([value, label]) => ({ value, label }))}
        values={filters.tools}
        onChange={(v) => onChange({ ...filters, tools: v })}
      />
      <MultiChipSelect
        label="Programming Languages"
        options={Object.entries(PROGRAMMING_LANGUAGE_LABELS).map(([value, label]) => ({ value, label }))}
        values={filters.languages}
        onChange={(v) => onChange({ ...filters, languages: v })}
      />
      <MultiChipSelect
        label="Recommended by Talents with Levels"
        options={Object.entries(TALENT_LEVEL_LABELS).map(([value, label]) => ({ value, label }))}
        values={filters.recommenderLevels}
        onChange={(v) => onChange({ ...filters, recommenderLevels: v })}
      />
      <MultiChipSelect
        label="Countries"
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
        values={filters.countries}
        onChange={(v) => onChange({ ...filters, countries: v })}
      />
      <MultiChipSelect
        label="Current Companies"
        options={companies.map((c) => ({ value: c.id, label: c.name }))}
        values={filters.companyIds}
        onChange={(v) => onChange({ ...filters, companyIds: v })}
      />
    </div>
  );
}
