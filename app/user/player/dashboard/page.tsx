import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfilePage from "../../profile/page";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function PlayerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  if (!user) {
    redirect("/auth/signup");
  }

  // Only allow users with role 'user' to view the player dashboard.
  if (user.role !== "user") {
    // If an admin visits this URL, send them to the admin dashboard.
    redirect("/user/admin/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Player Dashboard</h1>
      <ProfilePage />
      <DashboardClient />
    </div>
  );
}
