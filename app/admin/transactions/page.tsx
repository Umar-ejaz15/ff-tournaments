"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Receipt, CheckCircle, XCircle, Clock, User, Coins, DollarSign, ExternalLink, ArrowLeft, Image } from "lucide-react";

interface Transaction {
  id: string;
  amountCoins: number;
  amountPKR: number;
  method: string;
  type: string;
  status: string;
  proofUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (session?.user?.role !== "admin") {
      router.push("/user");
      return;
    }

    fetchTransactions();
  }, [session, status, router]);

  async function fetchTransactions() {
    try {
      const res = await fetch("/api/admin/transactions");
      if (res.ok) {
        const data = await res.json();

        // ✅ Only show coin-purchasing (non-withdrawal) transactions
        const filtered = data.filter((tx: Transaction) => tx.type !== "withdraw");
        setTransactions(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(transactionId: string, action: "approve" | "reject") {
    if (!confirm(`Are you sure you want to ${action} this transaction?`)) {
      return;
    }

    setProcessing(transactionId);
    try {
      const res = await fetch("/api/admin/transactions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, action }),
      });

      if (res.ok) {
        alert(`Transaction ${action}d successfully!`);
        fetchTransactions(); // Refresh list
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${action} transaction`);
      }
    } catch (err) {
      console.error(`Failed to ${action} transaction:`, err);
      alert(`Failed to ${action} transaction`);
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
            <Receipt className="w-8 h-8" />
            Coin Purchase Transactions
          </h1>
          <p className="text-gray-400">Review and approve user top-ups (deposits)</p>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">No coin purchase transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-yellow-400 flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Transaction Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">User:</span> 
                        <span className="text-white">{tx.user.name}</span>
                        <span className="text-gray-500">({tx.user.email})</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-400">Amount:</span> 
                        <span className="text-yellow-400 font-semibold">{tx.amountCoins} coins</span>
                        <span className="text-gray-500">(Rs. {tx.amountPKR})</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400">Method:</span> 
                        <span className="text-white">{tx.method}</span>
                      </p>
                      <p>
                        <span className="text-gray-400">Type:</span>{" "}
                        <span className="text-yellow-300 capitalize">{tx.type}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        {tx.status === "approved" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : tx.status === "rejected" ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-gray-400">Status:</span>{" "}
                        <span
                          className={`font-semibold ${
                            tx.status === "approved"
                              ? "text-green-400"
                              : tx.status === "rejected"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-400">Date:</span>{" "}
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-yellow-400 flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Payment Proof
                    </h3>
                    {tx.proofUrl ? (
                      <div>
                        <a
                          href={tx.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 underline mb-2 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Proof Image
                        </a>
                        <img
                          src={tx.proofUrl}
                          alt="Payment proof"
                          className="max-w-full h-48 object-contain border border-gray-700 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.png";
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No proof uploaded</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAction(tx.id, "approve")}
                    disabled={processing === tx.id || tx.status !== "pending"}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === tx.id ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction(tx.id, "reject")}
                    disabled={processing === tx.id || tx.status !== "pending"}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === tx.id ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
