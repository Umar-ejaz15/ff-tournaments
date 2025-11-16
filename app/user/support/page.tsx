"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (status === "loading") return <LoadingSpinner message="Verifying your account..." />;
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  // Redirect admins away from user support page
  if (status === "authenticated" && session?.user?.role === "admin") {
    router.push("/admin");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSuccess(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubject("");
        setMessage("");
        setSuccess("Support request submitted. We'll get back to you soon.");
      } else {
        setSuccess("Failed to submit support request.");
      }
    } catch (err) {
      console.error(err);
      setSuccess("An error occurred. Try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">Help & Support</h1>
        <p className="text-gray-400 mb-6">Describe your issue and our team will contact you.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg h-40"
              required
            />
          </div>

          <div>
            <button
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg"
              disabled={busy}
            >
              {busy ? "Submitting..." : "Submit Request"}
            </button>
          </div>

          {success && <div className="text-sm text-green-400">{success}</div>}
        </form>
      </div>
    </div>
  );
}
