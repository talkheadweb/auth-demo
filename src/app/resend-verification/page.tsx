import { AuthShell } from "@/components/auth-shell";
import { ResendVerificationForm } from "@/components/resend-verification-form";

type ResendVerificationPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ResendVerificationPage({ searchParams }: ResendVerificationPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Resend verification"
      description="Requests a fresh verification email from the backend. Like the backend API, this page stays generic about whether the account exists."
    >
      <ResendVerificationForm defaultEmail={params.email} />
    </AuthShell>
  );
}
