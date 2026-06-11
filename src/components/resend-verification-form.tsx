"use client";

import { FormEvent, useState } from "react";
import { StatusMessage } from "@/components/status-message";
import { apiRequest, getErrorMessage } from "@/lib/api";

type ResendVerificationFormProps = { defaultEmail?: string };

const inputCls = "w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15";

export function ResendVerificationForm({ defaultEmail = "" }: ResendVerificationFormProps) {
  const [email, setEmail]               = useState(defaultEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest<void>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess("If the account exists and is unverified, a new link has been sent.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
        <input
          id="email"
          type="email"
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      {success ? <StatusMessage kind="success" message={success} /> : null}
      {error   ? <StatusMessage kind="error"   message={error}   /> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Resend verification email"}
      </button>
    </form>
  );
}
