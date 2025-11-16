import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, Receipt, CheckCircle, ArrowRight, Coins, User, Mail, Calendar, Trophy } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Mark as dynamic since we use getServerSession which requires headers
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.email) {
      redirect("/auth/login");
    }

    // Enforce user role - admins should not access this page
    if (session.user.role === "admin") {
      redirect("/admin");
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          wallet: true,
          transactions: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
          teams: {
            include: {
              team: {
                include: {
                  tournament: true,
                  members: true,
                },
              },
            },
            orderBy: { id: "desc" },
            take: 10,
          },
        },
      });
    } catch (prismaError: any) {
      console.error("Prisma error in ProfilePage:", prismaError);
      // Avoid exposing session user values here (they may be stale or from another role).
      // Show a safe loading/verification UI instead and let the client retry or redirect.
      return (
        <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-6">
          <div className="max-w-2xl w-full text-center">
            <LoadingSpinner message="Verifying your account and loading data..." />
            <p className="mt-6 text-gray-400">Please wait while we verify your access. If this takes too long, try logging out and logging in again.</p>
            <div className="mt-4">
              <Link href="/auth/login" className="text-sm text-blue-400 hover:underline">Go to login</Link>
            </div>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-yellow-400">User Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Coins Balance</div>
              <Coins className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-400">{user?.wallet?.balance ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Available coins</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Tournaments Joined</div>
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{user?.teams?.length ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Active participations</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Total Transactions</div>
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{user?.transactions.length ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Payment history</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400 text-sm">Account Status</div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-xl font-bold text-green-400">Active</div>
            <div className="text-xs text-gray-500 mt-1">Ready to play</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/user/wallet"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
              >
                <Wallet className="w-4 h-4" />
                My Wallet
              </Link>
              <Link
                href="/user/tournaments"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Trophy className="w-4 h-4" />
                Join Tournament
              </Link>
              <Link
                href="/user/leaderboard"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Trophy className="w-4 h-4" />
                View Leaderboard
              </Link>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Name:
                </span>
                <span className="text-white font-medium">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email:
                </span>
                <span className="text-white font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member Since:
                </span>
                <span className="text-white font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Recent Transactions
            </h2>
            <Link
              href="/user/transactions"
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {user?.transactions && user.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Method</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {user.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-white text-sm">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-white text-sm capitalize">{tx.type}</td>
                      <td className="py-3 px-4">
                        <span className="text-yellow-400 font-medium">{tx.amountCoins} coins</span>
                        <span className="text-gray-500 text-xs ml-2">(Rs. {tx.amountPKR})</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">{tx.method}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === "approved"
                              ? "bg-green-500/20 text-green-400"
                              : tx.status === "rejected"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No transactions yet</p>
              <Link
                href="/user/wallet"
                className="inline-block mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
              >
                Buy Coins Now
              </Link>
            </div>
          )}
        </div>

        {/* Payment Verification Notice */}
        {user?.transactions && user.transactions.some((tx) => tx.status === "pending") && (
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">⏳ Pending Payments</h3>
            <p className="text-gray-300 text-sm">
              You have {user.transactions.filter((tx) => tx.status === "pending").length} pending
              payment(s) awaiting admin verification. Your coins will be added automatically once approved.
            </p>
          </div>
        )}

        {/* Joined Tournaments Section */}
        {user?.teams && user.teams.length > 0 && (
          <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Your Tournaments
              </h2>
              <span className="text-sm text-gray-400">
                {user.teams.length} joined
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.teams.map((teamMember) => {
                const team = teamMember.team;
                const tournament = team?.tournament;
                const isCaptain = team?.captainId === user.id;
                const totalMembers = team?.members?.length ?? 1;

                return (
                  <div key={team?.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1 truncate">{tournament?.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">Team: {team?.name}</p>
                      </div>
                      {isCaptain && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full ml-2">
                          Captain
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mode:</span>
                        <span className="text-white font-medium">{tournament?.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entry Fee:</span>
                        <span className="text-yellow-400 font-medium">{tournament?.entryFee} coins</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Members:</span>
                        <span className="text-blue-400 font-medium">{totalMembers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-medium ${
                          tournament?.status === "upcoming"
                            ? "text-blue-400"
                            : tournament?.status === "live"
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}>
                          {tournament?.status}
                        </span>
                      </div>
                      {tournament?.startTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Starts:</span>
                          <span className="text-white text-xs">
                            {new Date(tournament.startTime).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/user/tournaments/${tournament?.id}`}
                      className="mt-4 block w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium text-sm transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error) {
    console.error("ProfilePage error:", error);
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Page</h2>
            <p className="text-gray-300">
              An error occurred while loading this page. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
