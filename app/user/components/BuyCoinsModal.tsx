"use client";

import React, { useState } from "react";
import { pkrToCoins } from "@/lib/coins";
import { useRouter } from "next/navigation";

export default function BuyCoinsModal({ onClose }: { onClose: () => void }) {
  const [pkr, setPkr] = useState<number | "">("");
  const [method, setMethod] = useState<"JazzCash"|"EasyPaisa"|"Bank">("JazzCash");
  const [proofUrl, setProofUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const coins = typeof pkr === "number" ? pkrToCoins(pkr) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pkr || coins <= 0) {
      setError("Enter a valid PKR amount that converts to at least 1 coin.");
      return;
    }
    if (!proofUrl) {
      setError("Please provide a proof URL or screenshot upload link.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPKR: pkr,
          amountCoins: coins,
          method,
          proofUrl,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.message || "Failed to create transaction");
      }

      // success
      onClose();
      router.refresh(); // refresh profile / UI
      alert("Purchase submitted. Admin will verify and approve it.");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={submit}
        className="bg-white text-black rounded-xl p-6 w-full max-w-md"
      >
        <h3 className="text-xl font-semibold mb-4">Buy Coins</h3>

        <label className="block mb-2">
          PKR amount
          <input
            type="number"
            min={1}
            value={pkr}
            onChange={(e) => setPkr(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full border p-2 rounded mt-1"
          />
        </label>

        <p className="mb-2 text-sm text-gray-600">You will receive <strong>{coins}</strong> coins (50 coins = Rs.200)</p>

        <label className="block mb-2">
          Payment method
          <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full border p-2 rounded mt-1">
            <option>JazzCash</option>
            <option>EasyPaisa</option>
            <option>Bank</option>
          </select>
        </label>

        <label className="block mb-2">
          Proof URL (or upload link)
          <input
            type="text"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="https://... (screenshot or receipt url)"
            className="w-full border p-2 rounded mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">(You can upload proof to any storage and paste URL here.)</p>
        </label>

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? "Submitting..." : "Submit Purchase"}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
