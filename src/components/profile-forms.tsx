"use client";

import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { StatusMessage } from "@/components/status-message";
import { PasswordInput } from "@/components/password-input";
import { UserAvatar } from "@/components/user-avatar";
import type { User } from "@/types/auth";

const inputCls = "w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15";

export function ProfileForms({ user }: { user: User }) {
  const router       = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName]                           = useState(user.name);
  const [file, setFile]                           = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]               = useState<string | null>(null);
  const [currentPassword, setCurrentPassword]     = useState("");
  const [newPassword, setNewPassword]             = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [profileState,  setProfileState]          = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [passwordState, setPasswordState]         = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [savingProfile,  setSavingProfile]        = useState(false);
  const [savingPassword, setSavingPassword]       = useState(false);

  const memberSince = useMemo(
    () => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(user.createdAt)),
    [user.createdAt],
  );

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }, [previewUrl]);

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileState(null);
    try {
      const fd = new FormData();
      if (name.trim()) fd.append("name", name.trim());
      if (file) fd.append("profilePicture", file);
      await apiRequest<User>("/auth/profile", { method: "PATCH", body: fd });
      setProfileState({ type: "success", message: "Profile updated." });
      clearFile();
      router.refresh();
    } catch (err) {
      setProfileState({ type: "error", message: getErrorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordState({ type: "error", message: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    setPasswordState(null);
    try {
      await apiRequest<void>("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordState({ type: "success", message: "Password changed. Redirecting to login…" });
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
      setTimeout(() => { router.push("/login"); router.refresh(); }, 1500);
    } catch (err) {
      setPasswordState({ type: "error", message: getErrorMessage(err) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* ── Profile ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Profile details</h2>
          <p className="mt-1 text-xs text-slate-500">Update your display name and profile picture.</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Email",        value: user.email },
            { label: "Role",         value: user.role,     cls: "capitalize" },
            { label: "Verified",     value: user.isVerified ? "Yes" : "No — check email", cls: user.isVerified ? "text-emerald-400" : "text-amber-400" },
            { label: "Member since", value: memberSince },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-800/30 px-3.5 py-3">
              <p className="text-xs text-slate-600">{label}</p>
              <p className={`mt-1 truncate text-sm text-slate-200 ${cls ?? ""}`}>{value}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Avatar + picker */}
          <div className="flex items-center gap-4">
            <UserAvatar src={previewUrl ?? user.profilePicture} name={user.name} size={56} />
            <div className="flex-1 space-y-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/30 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800/60">
                {file ? "Change photo" : "Upload photo"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              {file && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 truncate max-w-[140px]">{file.name}</span>
                  <button type="button" onClick={clearFile} className="text-xs text-slate-600 hover:text-red-400 transition">Remove</button>
                </div>
              )}
              <p className="text-xs text-slate-600">PNG, JPG or WebP. Resized to 400×400.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="display-name" className="block text-sm font-medium text-slate-300">Display name</label>
            <input
              id="display-name"
              type="text"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              minLength={2}
              maxLength={50}
              required
            />
          </div>

          {profileState ? <StatusMessage kind={profileState.type} message={profileState.message} /> : null}

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* ── Security ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Change password</h2>
          <p className="mt-1 text-xs text-slate-500">Changing password will sign you out of all sessions.</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <PasswordInput
            label="Current password"
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <PasswordInput
            label="New password"
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
          <PasswordInput
            label="Confirm new password"
            id="confirm-new-password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />

          {passwordState ? <StatusMessage kind={passwordState.type} message={passwordState.message} /> : null}

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/30 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPassword ? "Updating…" : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
