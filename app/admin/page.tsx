import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function AdminPanal() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "admin") {
    redirect("/user");
  }

  // Get stats
  const [totalUsers, totalAdminUsers, totalTransactions, totalTournaments] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.transaction.count(),
    prisma.tournament.count(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {session.user.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Total Users</div>
            <div className="text-3xl font-bold text-white">{totalUsers}</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Admin Users</div>
            <div className="text-3xl font-bold text-yellow-400">{totalAdminUsers}</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Transactions</div>
            <div className="text-3xl font-bold text-white">{totalTransactions}</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Tournaments</div>
            <div className="text-3xl font-bold text-white">{totalTournaments}</div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/users"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              View All Users
            </Link>
            <button
              disabled
              className="px-6 py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
            >
              Manage Tournaments (Coming Soon)
            </button>
            <button
              disabled
              className="px-6 py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
            >
              View Reports (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
