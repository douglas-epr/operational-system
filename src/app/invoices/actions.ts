"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export interface InvoicePayload {
  code: string;
  company_or_user_name: string | null;
  document_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  client_name: string | null;
  service_price: number | null;
  due_date: string | null;
  service_title: string | null;
  service_description: string | null;
  swift_code: string | null;
  iban_code: string | null;
}

export async function createInvoice(
  data: InvoicePayload
): Promise<{ error?: string; invoice?: { id: string } }> {
  const supabase: AnySupabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: row, error } = await supabase
    .from("invoice")
    .insert({ ...data, created_by: user.id, updated_at: new Date().toISOString() })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/invoices");
  return { invoice: row };
}

export async function updateInvoice(
  id: string,
  patch: Partial<InvoicePayload>
): Promise<{ error?: string }> {
  const supabase: AnySupabase = await createClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) updates[k] = v;
  }
  const { error } = await supabase.from("invoice").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  return {};
}

export async function deleteInvoice(id: string): Promise<{ error?: string }> {
  const supabase: AnySupabase = await createClient();
  const { error } = await supabase.from("invoice").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  return {};
}
