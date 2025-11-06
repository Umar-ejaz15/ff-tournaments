"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminWithdrawalsPage() {
  const { data, mutate, isLoading } = useSWR(
    `/api/admin/transactions?status=pending&type=withdraw`,
    fetcher,
    { refreshInterval: 2000 }
    
  );
  console.log(data);

  async function act(id: string, action: "approve" | "reject") {
    if (!confirm(`Are you sure you want to ${action} this withdrawal?`)) return;
    const res = await fetch(`/api/admin/transactions/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: id, action }),
    });
    if (!res.ok) {
      alert((await res.json()).error || "Failed");
      return;
    }
    mutate();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Withdrawals — Pending</h1>
          <Link href="/admin" className="text-blue-400 hover:text-blue-300">
            ← Back to Admin
          </Link>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : !data || data.length === 0 ? (
          <div className="p-6 border border-neutral-800 rounded-xl bg-neutral-900">
            No pending withdrawals.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="min-w-full bg-neutral-900 text-sm">
              <thead className="bg-neutral-800 text-gray-300">
                <tr>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Account / Number</th>
                  <th className="p-3">Coins</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Requested</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t: any) => (
                  <tr key={t.id} className="border-b border-neutral-800">
                    <td className="p-3">
                      <div className="font-medium">{t.user?.name}</div>
                      <div className="text-xs text-gray-500">{t.user?.email}</div>
                    </td>

                    <td className="p-3 text-gray-300">
                      {t.user?.number ? (
                        <span className="font-mono text-sm">{t.user.number}</span>
                      ) : (
                        <span className="text-gray-500 italic">N/A</span>
                      )}
                    </td>

                    <td className="p-3 text-gray-300">
                      {t.proofUrl ? (
                        <span className="font-mono text-sm">{t.proofUrl}</span>
                      ) : (
                        <span className="text-gray-500 italic">N/A</span>
                      )}
                    </td>

                    <td className="p-3 text-yellow-400">{t.amountCoins}</td>
                    <td className="p-3">{t.method}</td>
                    <td className="p-3">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => act(t.id, "approve")}
                          className="px-3 py-1 rounded bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => act(t.id, "reject")}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
