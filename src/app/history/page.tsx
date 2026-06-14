import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GenerationHistory } from "@/components/generation-history";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <GenerationHistory />;
}
