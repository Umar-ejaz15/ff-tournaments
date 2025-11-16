import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

// Mark as dynamic since we use getServerSession which requires headers
export const dynamic = "force-dynamic";

export default async function UserDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  let user = null;
  try {
    user = await prisma.user.findUnique({ where: { email: session.user.email } });
  } catch (error) {
    console.error("UserDashboard error:", error);
    // If there's a Prisma error, show a helpful message instead of redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Database Connection Error</h1>
          <p className="text-gray-600 mb-4">Unable to connect to the database. Please try again later.</p>
          <a href="/auth/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect("/auth/signup");
  }

  // Redirect to role-specific dashboard under /user
  if (user.role === "admin") {
    redirect("/user/admin/dashboard");
  }

  // Default to player dashboard for regular users
  redirect("/user/player/dashboard");
}
