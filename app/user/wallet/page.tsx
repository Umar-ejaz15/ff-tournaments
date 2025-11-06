"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import BuyCoinsModal from "@/app/user/components/BuyCoinsModal";

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withAmount, setWithAmount] = useState<string>("");
  const [withMethod, setWithMethod] = useState<"EasyPaisa" | "JazzCash" | "Bank">("EasyPaisa");
  const [withAccount, setWithAccount] = useState<string>("");
  const [withBusy, setWithBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (session) {
      fetchWalletData();
    }
  }, [session, status, router]);

  async function fetchWalletData() {
    try {
      const res = await fetch("/api/user/wallet");
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance || 0);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    } finally {
      setLoading(false);
    }
  }

  async function submitWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    const amountCoins = Number(withAmount);
    if (!amountCoins || amountCoins <= 0) {
      alert("Enter a valid coin amount");
      return;
    }
    if (amountCoins > walletBalance) {
      alert("Insufficient balance");
      return;
    }
    if (!withAccount.trim()) {
      alert("Enter your account / number");
      return;
    }
    setWithBusy(true);
    try {
      const res = await fetch("/api/user/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCoins, method: withMethod, account: withAccount }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit withdrawal");
      }
      alert("Withdrawal request submitted. Admin will review shortly.");
      setWithAmount("");
      setWithAccount("");
      fetchWalletData();
    } catch (err: any) {
      alert(err.message || "Failed to submit withdrawal");
    } finally {
      setWithBusy(false);
    }
  }

  const handleBuyCoins = (amountPKR: number) => {
    setSelectedAmount(amountPKR);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/user"
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-yellow-400">💰 My Wallet</h1>
          <p className="text-gray-400">Manage your coins and transactions</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Available Balance</p>
              <h2 className="text-5xl font-bold text-yellow-400">{walletBalance}</h2>
              <p className="text-gray-400 text-sm mt-1">coins</p>
            </div>
            <button
              onClick={() => handleBuyCoins(200)}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
            >
              + Buy Coins
            </button>
          </div>
        </div>

        {/* Buy Coins Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Purchase Coins</h2>
          <p className="text-gray-400 mb-6">
            50 coins = Rs. 200 (1 coin = Rs. 4). Upload payment proof and admin will verify it.
          </p>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Payment Instructions</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p><strong className="text-blue-300">Methods:</strong> EasyPaisa / JazzCash / NayaPay / Bank Transfer</p>
              <p>After payment, upload screenshot. Admin verifies within 24 hours.</p>
              <p>For bank details, check tournament page when joining.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { coins: 50, pkr: 200, label: "Starter" },
              { coins: 100, pkr: 400, label: "Popular" },
              { coins: 250, pkr: 1000, label: "Best Value" },
            ].map((pkg, idx) => (
              <div
                key={pkg.coins}
                className={`bg-gray-800/50 border rounded-xl p-6 text-center ${
                  idx === 1 ? "border-yellow-500" : "border-gray-700"
                }`}
              >
                <h3 className="text-2xl font-bold text-white mb-1">{pkg.coins} Coins</h3>
                <p className="text-gray-400 text-xs mb-2">{pkg.label}</p>
                <p className="text-2xl font-bold text-yellow-400 mb-4">Rs. {pkg.pkr}</p>
                <button
                  onClick={() => handleBuyCoins(pkg.pkr)}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    idx === 1
                      ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Withdraw Coins */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Withdraw Coins</h2>
          <p className="text-gray-400 mb-6">Request a manual withdrawal. Admin will mark it paid after sending.</p>
          <form onSubmit={submitWithdrawal} className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Amount (coins)</span>
              <input
                type="number"
                value={withAmount}
                onChange={(e) => setWithAmount(e.target.value)}
                placeholder="e.g. 250"
                className="bg-neutral-800 p-2 rounded-lg outline-none"
                min={1}
              />
              <span className="text-xs text-gray-500">You have {walletBalance} coins</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Method</span>
              <select
                className="bg-neutral-800 p-2 rounded-lg"
                value={withMethod}
                onChange={(e) => setWithMethod(e.target.value as any)}
              >
                <option>EasyPaisa</option>
                <option>JazzCash</option>
                <option>Bank</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 md:col-span-1">
              <span className="text-sm text-gray-400">Account / Number</span>
              <input
                value={withAccount}
                onChange={(e) => setWithAccount(e.target.value)}
                placeholder="e.g., 03001234567 or Bank IBAN"
                className="bg-neutral-800 p-2 rounded-lg outline-none"
              />
            </label>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={withBusy}
                className={`px-4 py-2 rounded-lg font-semibold ${withBusy ? "bg-gray-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {withBusy ? "Submitting..." : "Submit Withdrawal Request"}
              </button>
            </div>
          </form>
        </div>

        {/* Transaction History */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-yellow-400">Transaction History</h2>
            <Link
              href="/user/transactions"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All →
            </Link>
          </div>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Type</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((tx: any) => (
                    <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-white text-sm">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-white text-sm capitalize">{tx.type}</td>
                      <td className="py-3 px-4">
                        <span className="text-yellow-400 font-medium">{tx.amountCoins} coins</span>
                      </td>
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
              <p className="text-gray-400 mb-4">No transactions yet</p>
              <button
                onClick={() => handleBuyCoins(200)}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg"
              >
                Buy Your First Coins
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <BuyCoinsModal
          initialAmount={selectedAmount || undefined}
          onClose={() => {
            setShowModal(false);
            setSelectedAmount(null);
            fetchWalletData(); // Refresh after purchase
          }}
        />
      )}
    </div>
  );
}

