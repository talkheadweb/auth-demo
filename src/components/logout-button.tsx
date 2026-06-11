"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest, getErrorMessage } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogout = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSubmitting}
        className="rounded-2xl border border-rose-400/40 px-4 py-3 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing out..." : "Sign out"}
      </button>
      {errorMessage ? <p className="text-sm text-rose-200">{errorMessage}</p> : null}
    </div>
  );
}
