import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

interface Props {
  searchParams: Promise<{ social_error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { social_error } = await searchParams;

  return (
    <AuthShell title="Welcome back" description="Sign in to your account">
      <LoginForm initialError={social_error} />
    </AuthShell>
  );
}
