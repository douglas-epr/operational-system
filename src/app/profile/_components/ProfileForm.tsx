"use client";

import { useState, useTransition, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "../actions";
import SignatureEditor from "./SignatureEditor";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Belgium",
  "Bolivia","Brazil","Canada","Chile","China","Colombia","Croatia","Czech Republic",
  "Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana",
  "Greece","Guatemala","Honduras","Hungary","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Japan","Jordan","Kenya","Lebanon","Malaysia",
  "Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Pakistan",
  "Panama","Paraguay","Peru","Philippines","Poland","Portugal","Romania","Russia",
  "Saudi Arabia","Serbia","Singapore","South Africa","South Korea","Spain",
  "Sweden","Switzerland","Taiwan","Thailand","Turkey","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Venezuela","Vietnam",
];

interface Props {
  profile: {
    first_name: string;
    last_name:  string;
    picture:    string;
    country:    string;
    email:      string;
    signature:  string | null;
  };
}

export default function ProfileForm({ profile }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName,  setLastName]  = useState(profile.last_name);
  const [country,   setCountry]   = useState(profile.country || "");
  const [picture,   setPicture]   = useState(profile.picture);
  const [preview,   setPreview]   = useState(profile.picture);
  const [signature, setSignature] = useState<string | null>(profile.signature);

  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const ext  = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPicture(data.publicUrl);
      setPreview(data.publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfile({ first_name: firstName, last_name: lastName, country, picture, signature });
      if (result?.error) setError(result.error);
      else setSuccess(true);
    });
  }

  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-32 h-32 rounded-full border-2 border-dashed border-border hover:border-accent flex items-center justify-center overflow-hidden transition-colors relative group"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-text-muted">{initials}</span>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <span className="text-white text-xs">{uploading ? "Uploading…" : "Change"}</span>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Error / Success */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-3 py-2 rounded-md">
          Profile updated successfully.
        </div>
      )}

      {/* First + Last name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">First Name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            className="input-field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Last Name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            className="input-field"
          />
        </div>
      </div>

      {/* Email (read-only) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Email</label>
        <input
          value={profile.email}
          disabled
          className="input-field opacity-50 cursor-not-allowed"
        />
      </div>

      {/* Country */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Country</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="input-field"
        >
          <option value="">Select country…</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Signature */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-secondary">Signature</label>
        <p className="text-xs text-text-muted">
          Used to sign agreements. Upload a PNG/JPG or draw one below.
        </p>
        <div className="mt-2">
          <SignatureEditor
            initialUrl={signature}
            onChange={(url) => setSignature(url)}
          />
        </div>
      </div>

      <hr className="border-border" />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isPending || uploading}
        className="w-full px-4 py-3 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
