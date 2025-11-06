"use client";

import React, { useState } from "react";
import { pkrToCoins } from "@/lib/coins";
import { useRouter } from "next/navigation";

export default function BuyCoinsModal({ onClose, initialAmount }: { onClose: () => void; initialAmount?: number }) {
  const [pkr, setPkr] = useState<number | "">(initialAmount || "");
  const [method, setMethod] = useState<"JazzCash"|"EasyPaisa"|"NayaPay"|"Bank">("JazzCash");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string>("");
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  const coins = typeof pkr === "number" ? pkrToCoins(pkr) : 0;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
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
      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  async function uploadProof(): Promise<string | null> {
    if (useUrlInput && proofUrl) {
      return proofUrl;
    }

    if (!proofFile) {
      return null;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", proofFile);

      const res = await fetch("/api/upload/proof", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Upload failed");
      }

      const data = await res.json();
      return data.url;
    } catch (err: any) {
      setError(err.message || "Failed to upload proof");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pkr || coins <= 0) {
      setError("Enter a valid PKR amount that converts to at least 1 coin.");
      return;
    }

    setLoading(true);
    try {
      // Upload proof first if file is selected
      let finalProofUrl = proofUrl;
      if (!useUrlInput && proofFile) {
        const uploadedUrl = await uploadProof();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        finalProofUrl = uploadedUrl;
      } else if (useUrlInput && !proofUrl) {
        setError("Please upload a payment proof screenshot or provide a proof URL.");
        setLoading(false);
        return;
      } else if (!proofFile && !proofUrl) {
        setError("Please upload a payment proof screenshot.");
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

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Failed to create transaction");
      }

      const data = await res.json();
      
      // success
      onClose();
      router.refresh(); // refresh profile / UI
      alert("Payment proof submitted successfully! Admin will verify and approve it. Your coins will be added once approved.");
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
            <option>NayaPay</option>
            <option>Bank</option>
          </select>
        </label>

        <div className="mb-2">
          <label className="block mb-2">Payment Proof (Screenshot/Receipt)</label>
          
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setUseUrlInput(false)}
              className={`px-3 py-1 text-sm rounded ${!useUrlInput ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUseUrlInput(true)}
              className={`px-3 py-1 text-sm rounded ${useUrlInput ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Use URL
            </button>
          </div>

          {!useUrlInput ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border p-2 rounded mt-1"
              />
              {previewUrl && (
                <div className="mt-2">
                  <img src={previewUrl} alt="Proof preview" className="max-w-full h-32 object-contain border rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setProofFile(null);
                      setPreviewUrl(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                    }}
                    className="text-xs text-red-600 mt-1"
                  >
                    Remove
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Upload a screenshot of your payment (PNG, JPG - Max 5MB)</p>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://... (screenshot or receipt url)"
                className="w-full border p-2 rounded mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">(You can upload proof to any storage and paste URL here.)</p>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button type="submit" disabled={loading || uploading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {uploading ? "Uploading..." : loading ? "Submitting..." : "Submit Purchase"}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
