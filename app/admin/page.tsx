import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, UserCog, Clock, Receipt, Trophy, Settings, BarChart3, CheckSquare, TrendingUp } from "lucide-react";

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
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Users</div>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{totalUsers}</div>
            <div className="text-xs text-gray-500 mt-1">Registered accounts</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Admin Users</div>
              <UserCog className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-400">{totalAdminUsers}</div>
            <div className="text-xs text-gray-500 mt-1">Administrators</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Pending Payments</div>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-yellow-400">{pendingTransactions}</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting review</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Transactions</div>
              <Receipt className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">{totalTransactions}</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
              >
                <Users className="w-4 h-4" />
                Manage Users
              </Link>
              <Link
                href="/admin/transactions"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
              >
                <Receipt className="w-4 h-4" />
                Review Payments
              </Link>
              <Link
                href="/admin/tournaments"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg transition-colors font-semibold"
              >
                <Trophy className="w-4 h-4" />
                Manage Tournaments
              </Link>
              <Link
                href="/admin/tasks"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
              >
                <CheckSquare className="w-4 h-4" />
                Task Management
              </Link>
              <Link
                href="/admin/statistics"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-semibold"
              >
                <TrendingUp className="w-4 h-4" />
                View Statistics
              </Link>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              System Info
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Users:
                </span>
                <span className="text-white font-medium">{totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Admin Users:
                </span>
                <span className="text-yellow-400 font-medium">{totalAdminUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Total Transactions:
                </span>
                <span className="text-white font-medium">{totalTransactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Tournaments:
                </span>
                <span className="text-white font-medium">{totalTournaments}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
