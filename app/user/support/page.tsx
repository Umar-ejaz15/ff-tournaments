"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type SupportRequest = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  adminResponse?: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-400 bg-blue-400/20",
  "in-progress": "text-yellow-400 bg-yellow-400/20",
  resolved: "text-green-400 bg-green-400/20",
  closed: "text-gray-400 bg-gray-400/20",
};

const STATUS_ICONS: Record<string, any> = {
  open: AlertCircle,
  "in-progress": Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchRequests();
    }
  }, [status, session]);

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

  async function fetchRequests() {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSuccess(null);
    setError(null);

    if (!subject.trim() || !category || !message.trim()) {
      setError("Please fill in all required fields.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, priority, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubject("");
        setCategory("");
        setPriority("medium");
        setMessage("");
        setSuccess("Support request submitted successfully! We'll get back to you soon.");
        setShowForm(false);
        fetchRequests();
        setTimeout(() => {
          setSuccess(null);
          setShowForm(true);
        }, 3000);
      } else {
        setError(data.error || "Failed to submit support request.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-yellow-400">Help & Support</h1>
        </div>

        {/* My Requests Section */}
        {requests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">My Support Requests</h2>
            <div className="space-y-3">
              {requests.map((req) => {
                const StatusIcon = STATUS_ICONS[req.status] || AlertCircle;
                return (
                  <div
                    key={req.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{req.subject}</h3>
                          <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                            {req.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Priority: <span className="capitalize">{req.priority}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[req.status] || STATUS_COLORS.open}`}
                      >
                        <StatusIcon className="w-4 h-4" />
                        <span className="capitalize">{req.status.replace("-", " ")}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-gray-200 text-sm whitespace-pre-wrap">{req.message}</div>
                    {req.adminResponse && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm font-semibold text-yellow-400 mb-1">Admin Response:</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{req.adminResponse}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Request Form */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Submit New Request</h2>
            {requests.length > 0 && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="text-sm text-yellow-400 hover:text-yellow-300"
              >
                {showForm ? "Hide Form" : "Show Form"}
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="account">Account Issues</option>
                    <option value="payment">Payment & Transactions</option>
                    <option value="tournament">Tournament Related</option>
                    <option value="technical">Technical Support</option>
                    <option value="refund">Refund Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 h-32 resize-none"
                  placeholder="Please provide detailed information about your issue..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include any relevant details, steps to reproduce, or error messages.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={busy}
                >
                  {busy ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubject("");
                    setCategory("");
                    setPriority("medium");
                    setMessage("");
                    setError(null);
                  }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>

              {success && (
                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                  {success}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
