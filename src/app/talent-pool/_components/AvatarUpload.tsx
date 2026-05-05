"use client";

/**
 * Avatar upload widget — uploads to the `talent-avatars` storage bucket
 * via the authenticated browser client (RLS allows admin/manager/operational
 * to write). Used by TalentFormModal, RecommenderFormModal, ClientFormModal.
 */

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  size?: "sm" | "md";
}

export default function AvatarUpload({ value, onChange, size = "md" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const px = size === "sm" ? "w-20 h-20" : "w-28 h-28";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("talent-avatars")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("talent-avatars").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={`${px} rounded-full border-2 border-dashed border-border hover:border-accent flex items-center justify-center overflow-hidden transition-colors relative group`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-text-muted">+ Photo</span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
          <span className="text-white text-[11px]">{uploading ? "Uploading…" : "Change"}</span>
        </div>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[11px] text-text-muted hover:text-red-400"
        >
          Remove
        </button>
      )}
      {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
    </div>
  );
}
