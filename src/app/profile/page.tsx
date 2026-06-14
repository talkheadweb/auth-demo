import { redirect } from "next/navigation";
import { ProfileForms } from "@/components/profile-forms";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header card */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <UserAvatar src={user.profilePictureUrl} name={user.name} size={48} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-100">{user.name}</p>
            <p className="truncate text-sm text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.isVerified ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
            {user.isVerified ? "Verified" : "Unverified"}
          </span>
          <span className="rounded-full border border-slate-700/60 px-2.5 py-1 text-xs capitalize text-slate-400">
            {user.role}
          </span>
        </div>
      </div>

      <ProfileForms user={user} />
    </div>
  );
}
