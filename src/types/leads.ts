/**
 * Types for the Leads page.
 *
 * Leads are stored in the `client` table (Bubble's `client` Data Type — see
 * docs/reference_docs/tabelas.md §client). The Leads page is a CRUD UI
 * scoped to admin/manager/operational users.
 */

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  picture: string | null;
  country: string | null;
  created_at: string;
}

export interface LeadInput {
  name: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  picture: string | null;
  country: string | null;
}
