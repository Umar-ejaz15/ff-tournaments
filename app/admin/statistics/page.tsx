"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import { BarChart3, TrendingUp, Users, Trophy, Coins, DollarSign, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Statistics {
  totalUsers: number;
  totalTournaments: number;
  totalTransactions: number;
  totalRevenue: number;
  activeTournaments: number;
  completedTournaments: number;
  pendingWithdrawals: number;
  totalCoinsInCirculation: number;
  recentActivity: any[];
}

export default function StatisticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: stats, isLoading } = useSWR<Statistics>(
    status === "authenticated" && session?.user?.role === "admin" ? "/api/admin/statistics" : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/user");
    }
  }, [status, session, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 inline-block transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-yellow-400 flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Statistics & Analytics
          </h1>
          <p className="text-gray-400">Comprehensive overview of platform metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Users</div>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalUsers || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Registered accounts</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Tournaments</div>
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalTournaments || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.activeTournaments || 0} active, {stats.completedTournaments || 0} completed
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Revenue</div>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">Rs. {stats.totalRevenue || 0}</div>
            <div className="text-xs text-gray-500 mt-1">From all transactions</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Coins in Circulation</div>
              <Coins className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalCoinsInCirculation || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Total coins distributed</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-yellow-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Transaction Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Transactions:</span>
                <span className="text-white font-medium">{stats.totalTransactions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pending Withdrawals:</span>
                <span className="text-yellow-400 font-medium">{stats.pendingWithdrawals || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-yellow-400 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tournament Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Active:</span>
                <span className="text-green-400 font-medium">{stats.activeTournaments || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completed:</span>
                <span className="text-blue-400 font-medium">{stats.completedTournaments || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-yellow-400 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Users:</span>
                <span className="text-white font-medium">{stats.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Growth:</span>
                <span className="text-green-400 font-medium">+12%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Revenue Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-2">Total Revenue (PKR)</p>
              <p className="text-3xl font-bold text-green-400">Rs. {stats.totalRevenue || 0}</p>
              <p className="text-xs text-gray-500 mt-1">From coin purchases</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Total Coins Sold</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.totalCoinsInCirculation || 0}</p>
              <p className="text-xs text-gray-500 mt-1">1 coin = Rs. 4</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

