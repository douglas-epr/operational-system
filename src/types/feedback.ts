/**
 * Shared TypeScript interfaces for the /feedback page.
 * Mirrors the `public.feedback` table (tabelas.md §feedback, paginas.md §feedback).
 */

import type { UserType } from "@/types/projects";

export interface Feedback {
  id: string;
  project_id: string | null;
  comment: string | null;
  rating: number | null;
  user_type: UserType | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackInput {
  project_id: string | null;
  comment: string | null;
  rating: number | null;
}
