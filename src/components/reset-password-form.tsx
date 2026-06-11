"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { StatusMessage } from "@/components/status-message";
import { PasswordInput } from "@/components/password-input";
import { apiRequest, getErrorMessage } from "@/lib/api";

type ResetPasswordFormProps = { token?: string; userId?: string };

export function ResetPasswordForm({ token, userId }: ResetPasswordFormProps) {
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !userId) { setError("Reset link is missing token or userId."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest<void>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ userId, token, password }),
      });
      setSuccess("Password updated. You can sign in with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        label="New password"
        id="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
      />

      <PasswordInput
        label="Confirm new password"
        id="confirm-new-password"
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
        {isSubmitting ? "Updating…" : "Update password"}
      </button>

      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-sky-400 transition hover:text-sky-300">
          ← Back to login
        </Link>
      </p>
    </form>
  );
}
