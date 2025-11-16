import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserAdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  if (!user) {
    redirect("/auth/signup");
  }

  // Only allow admin users here; non-admins should go to the player dashboard
  if (user.role !== "admin") {
    redirect("/user/player/dashboard");
  }

  // For now, route admin users into the main /admin area to reuse existing admin UI.
  // This keeps admin functionality centralized.
  redirect("/admin");
}
