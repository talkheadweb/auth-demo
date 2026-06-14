import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PlaygroundPanel } from "@/components/playground-panel";

export default async function PlaygroundPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <PlaygroundPanel />;
}
