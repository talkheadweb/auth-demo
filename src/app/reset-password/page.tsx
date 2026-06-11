import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; userId?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Reset password"
      description="Open this page from the email link. It reads the token and userId from the URL, then sends the new password to the backend reset-password endpoint."
    >
      <ResetPasswordForm token={params.token} userId={params.userId} />
    </AuthShell>
  );
}
