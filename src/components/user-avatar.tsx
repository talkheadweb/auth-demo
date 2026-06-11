"use client";

import { useState } from "react";

interface Props {
  src      ?: string | null;
  name      : string;
  size     ?: number;
  className ?: string;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

/**
 * Shows the user's profile picture if the URL loads successfully.
 * Falls back to initials on load error or when no URL is provided.
 *
 * Works in both server-rendered and client-rendered contexts because
 * it is a "use client" component — safe to import from server components.
 */
export function UserAvatar({ src, name, size = 40, className = "" }: Props) {
  const [imgError, setImgError] = useState(false);

  // Accept http/https URLs (remote images) and blob: URLs (local file preview)
  const showImage = !!src && (src.startsWith("http") || src.startsWith("blob:")) && !imgError;

  const ring   = "ring-2 ring-slate-700";
  const shared = `rounded-full flex-shrink-0 ${ring} ${className}`;

  if (showImage) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`object-cover ${shared}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-sky-500/15 font-semibold text-sky-300 ${shared}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
