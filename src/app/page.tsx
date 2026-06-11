import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const flows = [
  "Register with email verification",
  "Login with httpOnly cookie session",
  "Forgot & reset password",
  "Email verification & resend",
  "Protected profile page",
  "Profile update & password change",
  "Google OAuth (social login)",
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Auth demo</h1>
        <p className="mt-2 text-sm text-slate-400">
          Full auth flow wired to the Talkhead Express backend — cookies, JWT, email verification, OAuth.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        {/* Flows */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Implemented flows</p>
          <ul className="space-y-2.5">
            {flows.map((flow) => (
              <li key={flow} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 flex-shrink-0" aria-hidden />
                {flow}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link href="/register" className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400">
              Create account
            </Link>
            <Link href="/login" className="rounded-xl border border-slate-700/60 bg-slate-800/30 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/60">
              Sign in
            </Link>
          </div>
        </div>

        {/* Session snapshot */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 sm:w-64">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Session</p>

          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-sky-500/15 flex items-center justify-center text-xs font-semibold text-sky-300">
                  {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.role}</p>
                </div>
              </div>

              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-800/30 px-3.5 py-3">
                <Row label="Email" value={user.email} truncate />
                <Row label="Verified" value={user.isVerified ? "Yes" : "No"} color={user.isVerified ? "text-emerald-400" : "text-amber-400"} />
              </div>

              <Link href="/profile" className="block w-full rounded-xl border border-slate-700/60 bg-slate-800/30 py-2 text-center text-sm text-slate-300 transition hover:bg-slate-800/60">
                Open profile →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-800/30 px-3.5 py-3">
                <p className="text-xs text-slate-500">No active session. Sign in to test the protected routes.</p>
              </div>
              <Link href="/login" className="block w-full rounded-xl bg-sky-500/10 border border-sky-500/20 py-2 text-center text-sm text-sky-300 transition hover:bg-sky-500/20">
                Sign in →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, truncate, color }: { label: string; value: string; truncate?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-600">{label}</span>
      <span className={`${truncate ? "truncate max-w-[120px]" : ""} ${color ?? "text-slate-300"}`}>{value}</span>
    </div>
  );
}
