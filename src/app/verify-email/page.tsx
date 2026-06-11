import { AuthShell } from "@/components/auth-shell";
import { VerifyEmailPanel } from "@/components/verify-email-panel";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string; userId?: string; email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Verify email"
      description="This page is designed to be the landing target from verification emails. It immediately posts the token and userId back to the backend verify-email endpoint."
    >
      <VerifyEmailPanel token={params.token} userId={params.userId} email={params.email} />
    </AuthShell>
  );
}
