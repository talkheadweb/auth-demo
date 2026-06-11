/*
  Landing page for all OAuth provider redirects.

  The backend redirects here after a successful (or failed) social login:
    Success: /social-callback?token=<accessToken>
    Failure: /social-callback?error=<message>

  On success — cookies are already set as httpOnly by the backend before this
  redirect fires, so the user is fully authenticated. We just redirect to /profile.
  The ?token= value in the URL is the access token (for mobile clients) — the web
  client doesn't need it; the httpOnly cookies do all the work.

  On error — show the error message and provide a link back to login.
*/

import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { StatusMessage } from "@/components/status-message";
import Link from "next/link";

type SocialCallbackPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function SocialCallbackPage({ searchParams }: SocialCallbackPageProps) {
  const params = await searchParams;

  // Happy path — cookies already set, go straight to profile
  if (params.token && !params.error) {
    redirect("/profile");
  }

  // Error path — show the message
  return (
    <AuthShell
      title="Sign in failed"
      description="Something went wrong during social login. You can try again below."
    >
      <div className="space-y-6">
        <StatusMessage
          kind="error"
          message={params.error ?? "Google authentication failed. Please try again."}
        />

        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          <Link href="/login" className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-sky-300">
            Back to login
          </Link>
          <Link href="/register" className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-sky-300 hover:text-sky-100">
            Create account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
