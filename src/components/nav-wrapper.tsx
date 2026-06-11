import { getCurrentUser } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";

export async function NavWrapper() {
  const user = await getCurrentUser();
  return <NavLinks user={user} />;
}
