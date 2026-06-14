"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react"; // useEffect kept for pollGeneration cleanup
import { apiRequest, getErrorMessage } from "@/lib/api";
import { useGenerationSocket } from "@/hooks/useGenerationSocket";
import { StatusMessage } from "@/components/status-message";
import type { Generation } from "@/types/generation";

// ── Socket status badge ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  connected   : { dot: "bg-emerald-400", text: "text-emerald-400", label: "Connected"    },
  connecting  : { dot: "bg-amber-400 animate-pulse", text: "text-amber-400", label: "Connecting…" },
  disconnected: { dot: "bg-slate-600",   text: "text-slate-500",  label: "Disconnected"  },
  error       : { dot: "bg-red-500",     text: "text-red-400",    label: "Error"         },
} as const;

function SocketBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5">
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-medium ${cfg.text}`}>Socket: {cfg.label}</span>
    </div>
  );
}

// ── Input type toggle ──────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: "text" | "audio"; onChange: (v: "text" | "audio") => void }) {
  const btn = (v: "text" | "audio", label: string) => (
    <button
      key={v}
      type="button"
      onClick={() => onChange(v)}
      className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
        value === v
          ? "bg-sky-500 text-white"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-1 rounded-xl border border-slate-700/60 bg-slate-800/30 p-1">
      {btn("text", "Text input")}
      {btn("audio", "Audio input")}
    </div>
  );
}

// ── Live result card ───────────────────────────────────────────────────────
function ResultCard({ gen }: { gen: Generation }) {
  const statusColor = {
    pending   : "text-slate-400",
    processing: "text-amber-400",
    completed : "text-emerald-400",
    failed    : "text-red-400",
    cancelled : "text-slate-500",
  }[gen.status] ?? "text-slate-400";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500 truncate">ID: {gen._id}</p>
        <span className={`text-xs font-semibold capitalize ${statusColor}`}>{gen.status}</span>
      </div>

      {gen.status === "processing" && (
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Waiting for callback from external API…
        </div>
      )}

      {gen.status === "completed" && gen.outputUrl && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Output ready</p>
          <video
            controls
            className="w-full rounded-xl border border-slate-800 bg-black max-h-64"
            src={gen.outputUrl}
          />
          <a
            href={gen.outputUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition"
          >
            Open in new tab ↗
          </a>
        </div>
      )}

      {gen.status === "failed" && gen.errorMessage && (
        <p className="text-xs text-red-400">{gen.errorMessage}</p>
      )}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
const inputCls = "w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15";

export function PlaygroundPanel() {
  const { status: socketStatus, lastUpdate, clearLastUpdate } = useGenerationSocket(true);

  // Form state
  const [inputType,     setInputType]     = useState<"text" | "audio">("text");
  const [voiceId,       setVoiceId]       = useState("");
  const [avatarMode,    setAvatarMode]    = useState<"file" | "url">("file");
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarUrl,     setAvatarUrl]     = useState("");
  const [inputText,     setInputText]     = useState("");
  const [audioFile,     setAudioFile]     = useState<File | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [formError,     setFormError]     = useState<string | null>(null);

  // Live result — updated from socket or polling
  const [activeGen, setActiveGen] = useState<Generation | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const pollGeneration = useCallback((id: string) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const gen = await apiRequest<Generation>(`/generations/${id}`);
        setActiveGen(gen);
        if (gen.status === "completed" || gen.status === "failed" || gen.status === "cancelled") {
          stopPoll();
        }
      } catch { /* ignore transient errors */ }
    }, 4_000);
  }, [stopPoll]);

  // Socket update → refresh activeGen immediately
  useEffect(() => {
    if (!lastUpdate || !activeGen) return;
    if (lastUpdate.generationId !== activeGen._id) return;
    stopPoll();
    setActiveGen(prev => prev
      ? {
          ...prev,
          status       : lastUpdate.status as Generation["status"],
          outputFileKey: lastUpdate.outputFileKey ?? prev.outputFileKey,
          outputUrl    : lastUpdate.outputUrl    ?? prev.outputUrl,
          errorMessage : lastUpdate.errorMessage ?? prev.errorMessage,
        }
      : prev,
    );
    clearLastUpdate();
  }, [lastUpdate, activeGen, clearLastUpdate, stopPoll]);

  // Cleanup on unmount
  useEffect(() => () => { stopPoll(); }, [stopPoll]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    setActiveGen(null);
    stopPoll();

    try {
      const fd = new FormData();
      fd.append("inputType", inputType);
      fd.append("voiceId",   voiceId);

      if (avatarMode === "file" && avatarFile) fd.append("avatarImage", avatarFile);
      else if (avatarMode === "url" && avatarUrl.trim()) fd.append("avatarImageUrl", avatarUrl.trim());
      else { setFormError("Provide an avatar image file or URL."); setSubmitting(false); return; }

      if (inputType === "text") {
        if (!inputText.trim()) { setFormError("Input text is required."); setSubmitting(false); return; }
        fd.append("inputText", inputText.trim());
      } else {
        if (!audioFile) { setFormError("Audio file is required."); setSubmitting(false); return; }
        fd.append("inputAudio", audioFile);
      }

      const gen = await apiRequest<Generation>("/generations", { method: "POST", body: fd });
      setActiveGen(gen);

      // Poll as fallback — socket will stop it early if connected
      if (gen.status !== "completed" && gen.status !== "failed") {
        pollGeneration(gen._id);
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">

      {/* Header row with socket badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Generation Playground</h1>
          <p className="mt-0.5 text-sm text-slate-500">Submit a generation job and receive the result in real-time via socket.</p>
        </div>
        <SocketBadge status={socketStatus} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* ── Form ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">New generation</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Input type</label>
              <Toggle value={inputType} onChange={setInputType} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Voice ID</label>
              <input
                type="text"
                className={inputCls}
                value={voiceId}
                onChange={e => setVoiceId(e.target.value)}
                placeholder="e.g. af_heart"
                required
              />
            </div>

            {/* Avatar */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Avatar image</label>
              <div className="flex gap-2 mb-2">
                {(["file", "url"] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAvatarMode(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      avatarMode === m ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {m === "file" ? "Upload file" : "Enter URL"}
                  </button>
                ))}
              </div>
              {avatarMode === "file" ? (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-200"
                />
              ) : (
                <input
                  type="url"
                  className={inputCls}
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              )}
            </div>

            {/* Input content */}
            {inputType === "text" ? (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Input text</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={4}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type the text to be spoken…"
                  required
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Input audio</label>
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a"
                  onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-200"
                />
                <p className="text-xs text-slate-600">MP3, WAV, or M4A · max 12 MB</p>
              </div>
            )}

            {formError && <StatusMessage kind="error" message={formError} />}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Generate"}
            </button>
          </form>
        </div>

        {/* ── Live result ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Live result</p>

          {!activeGen ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-800">
              <p className="text-sm text-slate-600">Submit a generation to see the result here.</p>
            </div>
          ) : (
            <ResultCard gen={activeGen} />
          )}

          {socketStatus === "connected" && (
            <p className="text-xs text-emerald-500/70">
              Socket connected — result will appear instantly when the job completes.
            </p>
          )}
          {socketStatus !== "connected" && activeGen && (
            <p className="text-xs text-slate-600">
              Socket offline — polling every 4 s as fallback.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
