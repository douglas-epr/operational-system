"use client";

/**
 * AgencyForm — admin-only editor for the singleton agency record.
 *
 * Two fields (name + website). Mounted from `SettingsShell` only when
 * `profile.type === 'admin'`; the server action `saveAgencyInfo` also
 * gates server-side, and RLS rejects any write from a non-admin
 * session. So the only thing this form has to do is render the inputs
 * and surface errors via `toast`.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Agency } from "@/types/settings";
import { saveAgencyInfo } from "../actions";

interface Props {
  initialAgency: Agency | null;
}

export default function AgencyForm({ initialAgency }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialAgency?.name ?? "");
  const [website, setWebsite] = useState(initialAgency?.website ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveAgencyInfo({ name, website: website || null });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(initialAgency ? "Agency updated" : "Agency created");
      router.refresh();
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="agency-name" className="block text-sm font-medium text-text-primary mb-1.5">
          Agency name <span className="text-red-400">*</span>
        </label>
        <input
          id="agency-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Blur Studio"
          className={inputClass}
          disabled={isPending}
          maxLength={120}
        />
      </div>
      <div>
        <label htmlFor="agency-website" className="block text-sm font-medium text-text-primary mb-1.5">
          Website
        </label>
        <input
          id="agency-website"
          type="url"
          value={website ?? ""}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://blurapps.com"
          className={inputClass}
          disabled={isPending}
        />
      </div>
      <div className="pt-1">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving…" : initialAgency ? "Save Agency" : "Create Agency"}
        </button>
      </div>
    </form>
  );
}
