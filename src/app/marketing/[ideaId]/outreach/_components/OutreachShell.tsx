"use client";

/**
 * OutreachShell — two panels: Campaigns (list + create) and Prospects
 * (manual add + CSV import with template download + table). Campaigns link
 * to their detail page.
 */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MktCampaign, MktProspect } from "@/types/marketing";
import {
  addProspect,
  importProspects,
  deleteProspect,
  createCampaign,
  type ProspectInput,
} from "../actions";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  AddIcon,
  UploadIcon,
  DownloadIcon,
  DeleteIcon,
  SendIcon,
  ArrowRightIcon,
  UsersIcon,
} from "@/components/ui/icons";

const inputCls =
  "w-full px-3 py-2 bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent";

const CSV_HEADERS = ["name", "email", "company", "title", "linkedin_url"];
const CSV_EXAMPLE =
  "John Smith,john@acme.com,Acme Corp,CEO,https://linkedin.com/in/johnsmith";

interface Props {
  ideaId: string;
  initialCampaigns: MktCampaign[];
  initialProspects: MktProspect[];
}

export default function OutreachShell({
  ideaId,
  initialCampaigns,
  initialProspects,
}: Props) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <CampaignsPanel ideaId={ideaId} campaigns={initialCampaigns} />
      <ProspectsPanel ideaId={ideaId} prospects={initialProspects} />
    </div>
  );
}

function CampaignsPanel({
  ideaId,
  campaigns,
}: {
  ideaId: string;
  campaigns: MktCampaign[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    if (!name.trim()) return;
    start(async () => {
      const r = await createCampaign(ideaId, name);
      if (r.error) {
        setError(r.error);
        return;
      }
      setName("");
      if (r.id) router.push(`/marketing/${ideaId}/outreach/${r.id}`);
      else router.refresh();
    });
  }

  return (
    <section>
      <h2 className="text-heading-3 text-text-primary mb-3 flex items-center gap-2">
        <SendIcon className="w-4 h-4 text-text-muted" strokeWidth={2} /> Campaigns
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="New campaign name"
          className={inputCls}
        />
        <Button
          onClick={create}
          loading={isPending}
          leadingIcon={<AddIcon className="w-4 h-4" strokeWidth={2} />}
        >
          Create
        </Button>
      </div>
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      {campaigns.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<SendIcon />}
          title="No campaigns"
          body="Create a campaign, add sequence steps, then enroll prospects."
        />
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/marketing/${ideaId}/outreach/${c.id}`}
              className="card card-interactive flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {c.name}
                </p>
                <p className="text-xs text-text-muted capitalize">
                  {c.channel} · {c.status}
                </p>
              </div>
              <ArrowRightIcon
                className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0"
                strokeWidth={2}
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function ProspectsPanel({
  ideaId,
  prospects: rawProspects,
}: {
  ideaId: string;
  prospects: MktProspect[];
}) {
  // Deduplicate by email — the DB unique index prevents new duplicates but
  // historical data may still have them if the constraint was added later.
  const prospects = rawProspects.filter((p, i, arr) => {
    if (!p.email) return true;
    const key = p.email.toLowerCase();
    return arr.findIndex((q) => q.email?.toLowerCase() === key) === i;
  });

  const router = useRouter();
  const [addPending, startAdd] = useTransition();
  const [importPending, setImportPending] = useState(false);
  const [deletePending, startDelete] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showImportHelp, setShowImportHelp] = useState(false);

  const [form, setForm] = useState<ProspectInput>({
    email: "",
    name: "",
    company: "",
    title: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function add() {
    setError(null);
    startAdd(async () => {
      const r = await addProspect(ideaId, form);
      if (r.error) {
        setError(r.error);
        return;
      }
      setForm({ email: "", name: "", company: "", title: "" });
      router.refresh();
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportMsg(null);
    setImportPending(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const r = await importProspects(ideaId, rows);
      setImportMsg(
        r.error ? r.error : `Imported ${r.inserted}, skipped ${r.skipped}.`
      );
      router.refresh();
    } catch {
      setImportMsg("Failed to read file.");
    } finally {
      setImportPending(false);
    }
  }

  function downloadTemplate() {
    const csv =
      CSV_HEADERS.join(",") + "\r\n" + CSV_EXAMPLE + "\r\n";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prospects-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function remove(id: string) {
    startDelete(async () => {
      await deleteProspect(ideaId, id);
      router.refresh();
    });
  }

  return (
    <section>
      <h2 className="text-heading-3 text-text-primary mb-3 flex items-center gap-2">
        <UsersIcon className="w-4 h-4 text-text-muted" strokeWidth={2} /> Prospects
        <span className="text-xs text-text-muted font-normal">
          ({prospects.length})
        </span>
      </h2>

      {/* Add form */}
      <div className="card space-y-2 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className={inputCls}
          />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@company.com"
            className={inputCls}
          />
          <input
            value={form.company ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="Company"
            className={inputCls}
          />
          <input
            value={form.title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            className={inputCls}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* CSV import */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importPending}
              className="btn btn-tertiary btn-sm"
            >
              <UploadIcon className="w-4 h-4" strokeWidth={2} />
              {importPending ? "Importing…" : "Import CSV"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="hidden"
              aria-label="Import CSV file"
            />
            <button
              onClick={downloadTemplate}
              className="btn btn-tertiary btn-sm"
              title="Download CSV template"
            >
              <DownloadIcon className="w-4 h-4" strokeWidth={2} /> Template
            </button>
            <button
              onClick={() => setShowImportHelp((v) => !v)}
              className="text-text-muted hover:text-text-primary text-xs underline"
            >
              {showImportHelp ? "Hide" : "Format?"}
            </button>
          </div>

          <Button
            size="sm"
            onClick={add}
            loading={addPending}
            leadingIcon={<AddIcon className="w-4 h-4" strokeWidth={2} />}
          >
            Add prospect
          </Button>
        </div>

        {importMsg && (
          <p className="text-xs text-text-muted">{importMsg}</p>
        )}

        {showImportHelp && (
          <div className="rounded-lg bg-elevated border border-border p-3 space-y-1.5 text-xs">
            <p className="font-semibold text-text-primary">CSV format</p>
            <p className="text-text-muted">
              Required header row (exact column names, case-insensitive):
            </p>
            <code className="block text-accent font-mono bg-base rounded px-2 py-1">
              {CSV_HEADERS.join(", ")}
            </code>
            <p className="text-text-muted">
              Only <code className="text-accent">email</code> is required per row. Duplicates are skipped.
            </p>
            <p className="text-text-muted">
              Download the <button onClick={downloadTemplate} className="text-accent underline">template file</button> to get started quickly.
            </p>
          </div>
        )}
      </div>

      {prospects.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<UsersIcon />}
          title="No prospects yet"
          body="Add one above, import a CSV, or auto-source from the Sourcing tab."
        />
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border/60 max-h-[420px] overflow-y-auto">
          {prospects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary truncate">
                  {p.name || p.email}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {p.email}
                  {p.company ? ` · ${p.company}` : ""}
                </p>
              </div>
              <button
                onClick={() => remove(p.id)}
                disabled={deletePending}
                aria-label="Delete prospect"
                className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors shrink-0"
              >
                <DeleteIcon className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Minimal CSV parser: header row → {name,email,company,title,linkedin_url}. */
function parseCsv(text: string): ProspectInput[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: ProspectInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const get = (k: string) => {
      const idx = headers.indexOf(k);
      return idx >= 0 ? (cells[idx] ?? "").trim() : "";
    };
    const email = get("email");
    if (!email) continue;
    rows.push({
      email,
      name: get("name") || null,
      company: get("company") || null,
      title: get("title") || null,
      linkedin_url: get("linkedin_url") || get("linkedin") || null,
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
