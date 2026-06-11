"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusMessage } from "@/components/status-message";
import { apiRequest, getErrorMessage } from "@/lib/api";

type VerifyEmailPanelProps = { token?: string; userId?: string; email?: string };

export function VerifyEmailPanel({ token, userId, email }: VerifyEmailPanelProps) {
  const [status, setStatus]   = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!token || !userId) {
        setStatus("error");
        setMessage("Verification link is missing token or userId.");
        return;
      }
      try {
        await apiRequest<void>("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ userId, token }),
        });
        if (mounted) { setStatus("success"); setMessage("Email verified. You can now sign in."); }
      } catch (err) {
        if (mounted) { setStatus("error"); setMessage(getErrorMessage(err)); }
      }
    };

    void run();
    return () => { mounted = false; };
  }, [token, userId]);

  const resendHref = email
    ? `/resend-verification?email=${encodeURIComponent(email)}`
    : "/resend-verification";

  return (
    <div className="space-y-5">
      <StatusMessage
        kind={status === "success" ? "success" : status === "error" ? "error" : "info"}
        message={message}
      />

      {status === "success" ? (
        <Link
          href="/login"
          className="block w-full rounded-xl bg-sky-500 py-2.5 text-center text-sm font-medium text-white transition hover:bg-sky-400"
        >
          Go to login
        </Link>
      ) : (
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/login"
            className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/30 py-2.5 text-center text-sm text-slate-300 transition hover:bg-slate-800/60"
          >
            Go to login
          </Link>
          <Link
            href={resendHref}
            className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/30 py-2.5 text-center text-sm text-slate-300 transition hover:bg-slate-800/60"
          >
            Resend link
          </Link>
        </div>
      )}
    </div>
  );
}
