type StatusMessageProps = {
  kind: "success" | "error" | "info";
  message: string;
};

const v = {
  success: { bar: "bg-emerald-500", text: "text-emerald-300", wrap: "bg-emerald-500/8 border-emerald-500/20" },
  error:   { bar: "bg-red-500",     text: "text-red-300",     wrap: "bg-red-500/8 border-red-500/20" },
  info:    { bar: "bg-sky-500",     text: "text-sky-300",     wrap: "bg-sky-500/8 border-sky-500/20" },
} as const;

export function StatusMessage({ kind, message }: StatusMessageProps) {
  const s = v[kind];
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${s.wrap}`}>
      <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${s.bar}`} aria-hidden />
      <p className={s.text}>{message}</p>
    </div>
  );
}
