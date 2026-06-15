import { requirePageAccess } from "@/lib/auth/page-gate";
import PageShell from "@/components/layout/PageShell";
import type { UserProfile } from "@/types/projects";
import type { Invoice } from "@/types/docs";
import InvoicesList from "./_components/InvoicesList";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export default async function InvoicesPage() {
  const { supabase: sb, userId } = await requirePageAccess([
    "admin", "manager", "operational", "developer", "qa", "client", "lead",
  ]);
  const supabase = sb as AnySupabase;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, picture, type, signature")
    .eq("id", userId)
    .single();

  const { data: rows } = await supabase
    .from("invoice")
    .select("id, created_by, code, company_or_user_name, document_number, address, phone, email, client_name, service_price, due_date, service_title, service_description, swift_code, iban_code, created_at, updated_at")
    .order("created_at", { ascending: false });

  const invoices = ((rows ?? []) as unknown as (Omit<Invoice, "service_price"> & { service_price: number | string | null })[])
    .map((row) => ({
      ...row,
      service_price:
        row.service_price === null || row.service_price === undefined
          ? null
          : typeof row.service_price === "string"
            ? Number(row.service_price)
            : row.service_price,
    })) as Invoice[];

  return (
    <PageShell profile={profile as UserProfile | null} fullBleed flush>
      <div className="flex-1 flex flex-col min-h-0">
        <InvoicesList invoices={invoices} currentUserId={userId} />
      </div>
    </PageShell>
  );
}
