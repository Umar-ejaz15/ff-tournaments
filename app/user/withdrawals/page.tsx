"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UserWithdrawalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: wallet } = useSWR(status === "authenticated" ? "/api/user/wallet" : null, fetcher, { refreshInterval: 2000 });
  const { data: withdrawals, mutate } = useSWR(status === "authenticated" ? "/api/user/transactions?type=withdraw" : null, fetcher, { refreshInterval: 2000 });

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("EasyPaisa");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amountCoins = Number(amount);
    if (!amountCoins || amountCoins <= 0) return alert("Enter valid amount");
    if ((wallet?.balance ?? 0) < amountCoins) return alert("Insufficient balance");
    if (!account.trim()) return alert("Enter account/number");
    setBusy(true);
    try {
      const res = await fetch("/api/user/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCoins, method, account }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setAmount("");
      setAccount("");
      mutate();
      alert("Withdrawal request submitted.");
    } catch (e: any) {
      alert(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/user" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">← Back to Dashboard</Link>
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Withdrawals</h1>
        <p className="text-gray-400 mb-6">Balance: <span className="text-yellow-400 font-semibold">{wallet?.balance ?? 0}</span> coins</p>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Request Withdrawal</h2>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Amount (coins)</span>
              <input className="bg-gray-800 p-2 rounded-lg" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={1} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Method</span>
              <select className="bg-gray-800 p-2 rounded-lg" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>EasyPaisa</option>
                <option>JazzCash</option>
                <option>Bank</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Account / Number</span>
              <input className="bg-gray-800 p-2 rounded-lg" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="03001234567 or Bank IBAN" />
            </label>
            <div className="md:col-span-3">
              <button disabled={busy} className={`px-4 py-2 rounded-lg font-semibold ${busy ? "bg-gray-700" : "bg-blue-600 hover:bg-blue-700"}`}>{busy ? "Submitting..." : "Submit Request"}</button>
            </div>
          </form>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">My Withdrawal Requests</h2>
          {!withdrawals || withdrawals.length === 0 ? (
            <p className="text-gray-400">No withdrawal requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Method</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((t: any) => (
                    <tr key={t.id} className="border-b border-gray-800">
                      <td className="p-3">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="p-3 text-yellow-400">{t.amountCoins} coins</td>
                      <td className="p-3">{t.method}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === "approved" ? "bg-green-500/20 text-green-400" : t.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


