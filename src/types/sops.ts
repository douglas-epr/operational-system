import type { UserType } from "./projects";

export interface SopTag {
  id: string;
  name: string;
}

export interface SopWithTags {
  id: string;
  name: string | null;
  order: number | null;
  authorized_users: string[];
  authorized_user_types: UserType[];
  created_at: string;
  created_by: string | null;
  tags: SopTag[];
}

export interface SopVersion {
  id: string;
  sop_id: string;
  version_name: string;
  content: string | null;
  created_at: string;
  created_by?: string | null;
}

export const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
  { value: "admin",       label: "Admin" },
  { value: "manager",     label: "Manager" },
  { value: "operational", label: "Operational" },
  { value: "developer",   label: "Developer" },
  { value: "client",      label: "Client" },
  { value: "qa",          label: "QA" },
  { value: "referrer",    label: "Referrer" },
  { value: "lead",        label: "Lead" },
];
