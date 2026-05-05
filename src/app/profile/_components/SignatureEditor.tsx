"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initialUrl: string | null;
  onChange: (url: string | null) => void;
}

type Tab = "upload" | "draw";

export default function SignatureEditor({ initialUrl, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("upload");
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadBlob(blob: Blob, ext: string) {
    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("user-signatures")
        .upload(path, blob, { upsert: true, contentType: blob.type });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage
        .from("user-signatures")
        .getPublicUrl(path);
      setPreview(data.publicUrl);
      onChange(data.publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    if (!["png", "jpg", "jpeg"].includes(ext)) {
      setError("Only PNG or JPG files are allowed.");
      return;
    }
    await uploadBlob(file, ext);
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 border border-border rounded-md p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`px-3 py-1 text-xs rounded ${
            tab === "upload"
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setTab("draw")}
          className={`px-3 py-1 text-xs rounded ${
            tab === "draw"
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Draw
        </button>
      </div>

      {preview && (
        <div className="flex items-center gap-3">
          <div className="border border-border rounded-md p-2 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Signature preview"
              className="max-h-20"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-text-muted hover:text-red-400"
          >
            Remove
          </button>
        </div>
      )}

      {tab === "upload" ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm rounded-md bg-muted border border-border hover:border-accent text-text-primary disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Choose PNG or JPG"}
          </button>
        </div>
      ) : (
        <DrawPad onSave={(blob) => uploadBlob(blob, "png")} disabled={uploading} />
      )}

      {error && (
        <p className="text-xs text-red-400 border border-red-500/30 rounded bg-red-500/10 px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

function DrawPad({
  onSave,
  disabled,
}: {
  onSave: (blob: Blob) => void;
  disabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  }

  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPoint.current = pos(e);
  }

  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPoint.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
    setHasDrawn(true);
  }

  function handleUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    lastPoint.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/png");
  }

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        className="border border-border rounded-md bg-white touch-none w-full max-w-[400px] cursor-crosshair"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1.5 text-xs rounded-md bg-muted border border-border text-text-secondary hover:text-text-primary"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || !hasDrawn}
          className="px-4 py-1.5 text-xs rounded-md bg-accent hover:bg-accent-hover text-white disabled:opacity-60"
        >
          {disabled ? "Saving…" : "Save signature"}
        </button>
      </div>
    </div>
  );
}
