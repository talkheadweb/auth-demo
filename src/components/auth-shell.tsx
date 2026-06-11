import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-slate-50">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7">
        {children}
      </div>
    </div>
  );
}
