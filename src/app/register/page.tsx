"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { StatusMessage } from "@/components/status-message";
import { PasswordInput } from "@/components/password-input";
import { apiRequest, getErrorMessage } from "@/lib/api";

const inputCls = "w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15";

export default function RegisterPage() {
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest<void>(
        "/auth/register",
        { method: "POST", body: JSON.stringify({ name, email, password }) },
        { skipAuthRedirect: true },
      );
      setSuccess("Account created. Check your email for the verification link.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create an account" description="Fill in the details below to get started">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-slate-300">Name</label>
          <input
            id="name"
            type="text"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            autoComplete="name"
            minLength={2}
            maxLength={50}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
          <input
            id="email"
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <PasswordInput
          label="Password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />

        <PasswordInput
          label="Confirm password"
          id="confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />

        {success ? <StatusMessage kind="success" message={success} /> : null}
        {error   ? <StatusMessage kind="error"   message={error}   /> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-sky-400 transition hover:text-sky-300">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
