"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import type { User } from "@/types/auth";

type NavLinksProps = { user: User | null };

export function NavLinks({ user }: NavLinksProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try { await apiRequest<void>("/auth/logout", { method: "POST" }); } catch { /* clear happened server-side */ }
    setLoading(false);
    router.push("/login");
    router.refresh();
  };

  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`text-sm transition ${
        pathname === href
          ? "text-sky-400"
          : "text-slate-400 hover:text-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="flex items-center gap-6" aria-label="Main navigation">
      {link("/", "Home")}

      {user ? (
        <>
          {link("/playground", "Playground")}
          {link("/history", "History")}
          {link("/profile", "Profile")}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="text-sm text-slate-400 transition hover:text-slate-100 disabled:opacity-40"
          >
            {loading ? "…" : "Sign out"}
          </button>
        </>
      ) : (
        <>
          {link("/login", "Login")}
          <Link
            href="/register"
            className="rounded-lg bg-sky-500 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-sky-400"
          >
            Register
          </Link>
        </>
      )}
    </nav>
  );
}
