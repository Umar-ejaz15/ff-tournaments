import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

// Mark as dynamic since we use getServerSession which requires headers
export const dynamic = 'force-dynamic';

export default async function AdminPanal() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "admin") {
    redirect("/user");
  }

  // Get stats with error handling
  let totalUsers = 0;
  let totalAdminUsers = 0;
  let totalTransactions = 0;
  let totalTournaments = 0;
  let pendingTransactions = 0;

  try {
    [totalUsers, totalAdminUsers, totalTransactions, totalTournaments] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.transaction.count(),
      prisma.tournament.count(),
    ]);

    pendingTransactions = await prisma.transaction.count({
      where: { status: "pending" },
    });
  } catch (prismaError) {
    console.error("Prisma error in AdminPanel:", prismaError);
    // Stats will show as 0, but page will still render
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-yellow-400">Admin Dashboard</h1>
          <p className="text-gray-400 text-lg">Welcome back, {session.user.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="text-gray-400 text-sm mb-1">Total Users</div>
            <div className="text-3xl font-bold text-white">{totalUsers}</div>
            <div className="text-xs text-gray-500 mt-1">Registered accounts</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="text-gray-400 text-sm mb-1">Admin Users</div>
            <div className="text-3xl font-bold text-yellow-400">{totalAdminUsers}</div>
            <div className="text-xs text-gray-500 mt-1">Administrators</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="text-gray-400 text-sm mb-1">Pending Payments</div>
            <div className="text-3xl font-bold text-yellow-400">{pendingTransactions}</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting review</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="text-gray-400 text-sm mb-1">Total Transactions</div>
            <div className="text-3xl font-bold text-white">{totalTransactions}</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-center font-semibold"
              >
                 Manage Users
              </Link>
              <Link
                href="/admin/transactions"
                className="block w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-center font-semibold"
              >
                 Review Payments
              </Link>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">System Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Users:</span>
                <span className="text-white font-medium">{totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Admin Users:</span>
                <span className="text-yellow-400 font-medium">{totalAdminUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Transactions:</span>
                <span className="text-white font-medium">{totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tournaments:</span>
                <span className="text-white font-medium">{totalTournaments}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              disabled
              className="px-6 py-3 bg-gray-700/50 text-gray-400 rounded-lg cursor-not-allowed text-left"
            >
               Manage Tournaments
            </button>
            <button
              disabled
              className="px-6 py-3 bg-gray-700/50 text-gray-400 rounded-lg cursor-not-allowed text-left"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
