import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import { redirect } from "next/navigation";

// Mark as dynamic since we use getServerSession which requires headers
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      redirect("/auth/login");
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: {
          wallet: true,
          transactions: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
      });
    } catch (prismaError) {
      console.error("Prisma error in ProfilePage:", prismaError);
      // Return a fallback UI when Prisma fails
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-red-400 mb-2">Database Connection Error</h2>
              <p className="text-gray-300">
                Unable to load your profile data. Please try refreshing the page.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-yellow-400">User Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Coins Balance</div>
            <div className="text-3xl font-bold text-yellow-400">{user?.wallet?.balance ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Available coins</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Transactions</div>
            <div className="text-3xl font-bold text-white">{user?.transactions.length ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Payment history</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Account Status</div>
            <div className="text-xl font-bold text-green-400">Active</div>
            <div className="text-xs text-gray-500 mt-1">Ready to play</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/user/wallet"
                className="block w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg text-center transition-colors"
              >
                My Wallet
              </Link>
              <Link
                href="/user/tournaments"
                className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
              >
                Join Tournament
              </Link>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">Profile Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Member Since:</span>
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
            <h2 className="text-xl font-bold text-yellow-400">Recent Transactions</h2>
            <Link
              href="/user/transactions"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All →
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
      </div>
    </div>
  );
  } catch (error) {
    console.error("ProfilePage error:", error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
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
