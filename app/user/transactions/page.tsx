import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { History, ArrowLeft, Receipt, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

// Mark as dynamic since we use getServerSession which requires headers
export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
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
          transactions: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    } catch (prismaError) {
      console.error("Prisma error in TransactionsPage:", prismaError);
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-red-400 mb-2">Database Connection Error</h2>
              <p className="text-gray-300">
                Unable to load your transactions. Please try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/user"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 inline-block transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-yellow-400 flex items-center gap-3">
            <History className="w-8 h-8" />
            Transaction History
          </h1>
          <p className="text-gray-400">View all your payment transactions</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          {user?.transactions && user.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Coins</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Amount (PKR)</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Method</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {user.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-white text-sm">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-white text-sm capitalize">{tx.type}</td>
                      <td className="py-3 px-4">
                        <span className="text-yellow-400 font-medium">{tx.amountCoins} coins</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">Rs. {tx.amountPKR}</td>
                      <td className="py-3 px-4 text-gray-300 text-sm">{tx.method}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${
                            tx.status === "approved"
                              ? "bg-green-500/20 text-green-400"
                              : tx.status === "rejected"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {tx.status === "approved" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : tx.status === "rejected" ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tx.proofUrl ? (
                          <a
                            href={tx.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No transactions found</p>
              <Link
                href="/coins"
                className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
              >
                Buy Coins
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error("TransactionsPage error:", error);
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

