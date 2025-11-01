"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CoinsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status]);

  const handleBuyCoins = async (amountPKR: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPKR, method: "JazzCash" }),
      });
      const data = await res.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">💰 Buy Coins</h1>

      <p className="text-gray-600 mb-6">
        50 coins = 200 PKR. Your coins will be automatically added after payment.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {[{ coins: 50, pkr: 200 }, { coins: 100, pkr: 400 }, { coins: 250, pkr: 1000 }].map(
          (pkg) => (
            <div
              key={pkg.coins}
              className="border rounded-2xl p-4 shadow-sm bg-white hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {pkg.coins} Coins
              </h2>
              <p className="text-gray-500 mb-4">{pkg.pkr} PKR</p>
              <button
                onClick={() => handleBuyCoins(pkg.pkr)}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white w-full py-2 rounded-xl font-medium"
              >
                {loading ? "Processing..." : "Buy Now"}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
