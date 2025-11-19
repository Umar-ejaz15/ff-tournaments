"use client";

import React, { useState } from "react";
import { pkrToCoinsWithDiscount } from "@/lib/coins-discount";
import { getAccountNumber, getAllPaymentMethods, type PaymentMethod } from "@/lib/payment-config";
import { useRouter } from "next/navigation";

export default function BuyCoinsModal({
  onClose,
  initialAmount,
}: {
  onClose: () => void;
  initialAmount?: number;
}) {
  const [pkr, setPkr] = useState<number | "">(initialAmount || "");
  const allMethods = getAllPaymentMethods();
  const defaultMethod = (allMethods[0]?.method as PaymentMethod) ?? "EasyPaisa";
  const [method, setMethod] = useState<PaymentMethod>(defaultMethod);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  const coinCalculation = typeof pkr === "number" && pkr > 0 
    ? pkrToCoinsWithDiscount(pkr) 
    : { baseCoins: 0, discountPercent: 0, discountAmount: 0, finalCoins: 0, pkr: 0 };

  // -------------------
  // Handle File Upload
  // -------------------
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setProofFile(file);
    setError(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  // -------------------
  // Upload to backend
  // -------------------
  async function uploadProof(): Promise<string | null> {
    if (useUrlInput && proofUrl) return proofUrl;

    if (!proofFile) return null;

    const formData = new FormData();
    formData.append("file", proofFile);

    try {
      const res = await fetch("/api/upload/proof", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      return data.url;
    } catch (err: any) {
      setError(err.message || "Upload failed");
      return null;
    }
  }

  // -------------------
  // Submit Payment Proof
  // -------------------
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pkr || coinCalculation.finalCoins <= 0) {
      setError("Please enter a valid PKR amount.");
      return;
    }

    setLoading(true);

    try {
      // Upload proof if necessary
      let finalProofUrl = proofUrl;

      if (!useUrlInput && proofFile) {
        const uploaded = await uploadProof();
        if (!uploaded) {
          setLoading(false);
          return;
        }
        finalProofUrl = uploaded;
      }

      if (!finalProofUrl) {
        setError("Please upload a screenshot or paste a proof URL.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPKR: pkr,
          method,
          proofUrl: finalProofUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Payment proof submitted! Admin will verify it soon.");
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form onSubmit={submit} className="bg-white text-black rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Buy Coins</h3>

        <label className="block mb-2">
          PKR Amount
          <input
            type="number"
            min={1}
            value={pkr}
            onChange={(e) => setPkr(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full border p-2 rounded mt-1"
          />
        </label>

        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-1">
            <strong>Base Coins:</strong> {coinCalculation.baseCoins} coins
          </p>
          {coinCalculation.discountPercent > 0 && (
            <p className="text-sm text-green-600 font-semibold mb-1">
              🎉 <strong>{coinCalculation.discountPercent}% Bonus!</strong> +{coinCalculation.discountAmount} coins
            </p>
          )}
          <p className="text-sm font-bold text-gray-900">
            Total: <strong className="text-blue-600">{coinCalculation.finalCoins} coins</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (50 coins = Rs.200 base rate)
          </p>
        </div>

        <label className="block mb-2">
          Payment Method
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full border p-2 rounded mt-1"
          >
            {allMethods.map((pm) => (
              <option key={pm.method} value={pm.method}>
                {pm.name}
              </option>
            ))}
          </select>
        </label>

        {/* Bank Account Details */}
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-1">
            Send payment to {method}:
          </p>
          <p className="text-sm font-mono font-bold text-gray-900">
            {getAccountNumber(method)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Upload screenshot after payment
          </p>
        </div>

        {/* PROOF SECTION */}
        <div className="mb-2">
          <label className="block mb-2">Payment Proof</label>

          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setUseUrlInput(false)}
              className={`px-3 py-1 text-sm rounded ${
                !useUrlInput ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              Upload File
            </button>

            <button
              type="button"
              onClick={() => setUseUrlInput(true)}
              className={`px-3 py-1 text-sm rounded ${
                useUrlInput ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              Use URL
            </button>
          </div>

          {!useUrlInput ? (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border p-2 rounded mt-1"
              />

              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Proof preview"
                    className="max-w-full h-32 object-contain border rounded"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setProofFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                    className="text-xs text-red-600 mt-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </>
          ) : (
            <input
              type="text"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://your-proof-url"
              className="w-full border p-2 rounded mt-1"
            />
          )}
        </div>

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Purchase"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
