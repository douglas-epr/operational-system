export interface SopTag {
  id: string;
  name: string;
}

export interface SopWithTags {
  id: string;
  name: string | null;
  order: number | null;
  authorized_users: string[];
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
