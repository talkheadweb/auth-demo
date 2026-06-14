"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequestList, getErrorMessage } from "@/lib/api";
import type { Generation } from "@/types/generation";

// ── Status badge ───────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  pending   : "bg-slate-700/60 text-slate-400",
  processing: "bg-amber-500/10 text-amber-400",
  completed : "bg-emerald-500/10 text-emerald-400",
  failed    : "bg-red-500/10 text-red-400",
  cancelled : "bg-slate-700/30 text-slate-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[status] ?? "bg-slate-700 text-slate-400"}`}>
      {status}
    </span>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────
function GenerationRow({ gen }: { gen: Generation }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Intl.DateTimeFormat("en", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(gen.createdAt));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40">
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800/30 rounded-xl"
      >
        <StatusBadge status={gen.status} />
        <span className="flex-1 min-w-0 text-xs text-slate-400 capitalize">{gen.inputType} · {gen.voiceId}</span>
        <span className="text-xs text-slate-600 flex-shrink-0">{date}</span>
        <svg
          className={`h-3.5 w-3.5 flex-shrink-0 text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <Field label="ID"         value={gen._id} mono />
            <Field label="Input type" value={gen.inputType} />
            <Field label="Voice ID"   value={gen.voiceId} />
            {gen.completedAt && <Field label="Completed" value={new Date(gen.completedAt).toLocaleString()} />}
            {gen.inputText && (
              <div className="col-span-2">
                <p className="text-slate-600 mb-1">Input text</p>
                <p className="text-slate-300 whitespace-pre-wrap">{gen.inputText}</p>
              </div>
            )}
            {gen.errorMessage && (
              <div className="col-span-2">
                <p className="text-slate-600 mb-1">Error</p>
                <p className="text-red-400">{gen.errorMessage}</p>
              </div>
            )}
          </div>

          {gen.outputUrl && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">Output</p>
              <video controls className="w-full rounded-xl border border-slate-800 bg-black max-h-56" src={gen.outputUrl} />
              <a
                href={gen.outputUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 transition"
              >
                Open ↗
              </a>
            </div>
          )}

          {gen.avatarImageUrl && !gen.avatarImageKey?.startsWith("http") && (
            <div className="space-y-1">
              <p className="text-xs text-slate-600">Avatar image</p>
              <img src={gen.avatarImageUrl} alt="avatar" className="h-20 rounded-lg object-cover border border-slate-800" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-slate-600">{label}</p>
      <p className={`text-slate-300 truncate ${mono ? "font-mono text-[11px]" : ""}`}>{value}</p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export function GenerationHistory() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await apiRequestList<Generation>(
        `/generations?page=${p}&limit=10&sortBy=createdAt&sortOrder=desc`,
      );
      setGenerations(data);
      setPage(meta.page);
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="w-full max-w-3xl space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Generation History</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {loading ? "Loading…" : `${total} generation${total !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(page)}
          disabled={loading}
          className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800/60 disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {!loading && !error && generations.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-800">
          <p className="text-sm text-slate-600">No generations yet. Try the Playground.</p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          {generations.map(gen => <GenerationRow key={gen._id} gen={gen} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => load(page - 1)}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-4 py-2 text-xs text-slate-300 transition hover:bg-slate-800/60 disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => load(page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-slate-700/60 bg-slate-800/30 px-4 py-2 text-xs text-slate-300 transition hover:bg-slate-800/60 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
