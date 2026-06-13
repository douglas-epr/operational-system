/**
 * /talent-profile?code=<token> — public, unauthenticated.
 *
 * Loaded by a talent who received a 4-hour share link from a manager.
 * The SECURITY DEFINER RPC `get_talent_by_code` enforces token validity;
 * we render an "expired" card if it returns null.
 */

import { getTalentByCode } from "./actions";
import TalentSelfEditForm from "./_components/TalentSelfEditForm";

export const dynamic = "force-dynamic";

export default async function TalentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (!code) {
    return <ExpiredCard message="Missing share code." />;
  }

  const talent = await getTalentByCode(code);
  if (!talent) {
    return <ExpiredCard message="This link has expired or is invalid." />;
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-elevated">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#FFB800] flex items-center justify-center text-[#0D0D1A] text-sm font-bold">
            M
          </div>
          <span className="text-sm font-semibold text-text-primary tracking-tight">
            Move37
          </span>
        </div>
        <span className="text-xs text-text-muted">
          Editing your profile · link expires{" "}
          {talent.code_expires_at
            ? new Date(talent.code_expires_at).toLocaleString()
            : "soon"}
        </span>
      </header>
      <main className="flex-1 overflow-y-auto py-8">
        <div className="max-w-3xl mx-auto px-6">
          <TalentSelfEditForm code={code} initial={talent} />
        </div>
      </main>
    </div>
  );
}

function ExpiredCard({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-elevated border border-border rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-text-primary mb-1">
          Link unavailable
        </h1>
        <p className="text-sm text-text-secondary">{message}</p>
        <p className="text-xs text-text-muted mt-4">
          Ask your contact at Move37 to send you a new link.
        </p>
      </div>
    </div>
  );
}
