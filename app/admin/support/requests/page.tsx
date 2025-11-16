"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Send,
} from "lucide-react";

type SupportRequest = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt?: string;
  adminResponse?: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-400 bg-blue-400/20 border-blue-400/50",
  "in-progress": "text-yellow-400 bg-yellow-400/20 border-yellow-400/50",
  resolved: "text-green-400 bg-green-400/20 border-green-400/50",
  closed: "text-gray-400 bg-gray-400/20 border-gray-400/50",
};

const STATUS_ICONS: Record<string, any> = {
  open: AlertCircle,
  "in-progress": Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

export default function SupportRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SupportRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "admin") {
        router.push("/user");
        return;
      }
      fetchRequests();
    }
  }, [status, session, router]);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter, priorityFilter, searchQuery]);

  if (status === "loading" || loading) {
    return <LoadingSpinner message="Loading support requests..." />;
  }

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (session?.user?.role !== "admin") {
    return null;
  }

  async function fetchRequests() {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
        setFilteredRequests(data);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  }

  function filterRequests() {
    let filtered = [...requests];

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.subject.toLowerCase().includes(query) ||
          r.message.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query) ||
          (r.name && r.name.toLowerCase().includes(query))
      );
    }

    setFilteredRequests(filtered);
  }

  async function updateStatus(requestId: string, newStatus: string) {
    setUpdatingStatus(requestId);
    try {
      const res = await fetch(`/api/support/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchRequests();
        if (selectedRequest?.id === requestId) {
          setSelectedRequest({ ...selectedRequest, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function submitResponse(requestId: string) {
    if (!adminResponse.trim()) return;

    setUpdatingStatus(requestId);
    try {
      const res = await fetch(`/api/support/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminResponse: adminResponse.trim() }),
      });

      if (res.ok) {
        setAdminResponse("");
        await fetchRequests();
        if (selectedRequest?.id === requestId) {
          setSelectedRequest({ ...selectedRequest, adminResponse: adminResponse.trim() });
        }
      }
    } catch (err) {
      console.error("Failed to submit response:", err);
    } finally {
      setUpdatingStatus(null);
    }
  }

  const statusCounts = {
    all: requests.length,
    open: requests.filter((r) => r.status === "open").length,
    "in-progress": requests.filter((r) => r.status === "in-progress").length,
    resolved: requests.filter((r) => r.status === "resolved").length,
    closed: requests.filter((r) => r.status === "closed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-yellow-400">Support Requests</h1>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="all">All ({statusCounts.all})</option>
                <option value="open">Open ({statusCounts.open})</option>
                <option value="in-progress">In Progress ({statusCounts["in-progress"]})</option>
                <option value="resolved">Resolved ({statusCounts.resolved})</option>
                <option value="closed">Closed ({statusCounts.closed})</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No support requests found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Requests List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredRequests.map((req) => {
                const StatusIcon = STATUS_ICONS[req.status] || AlertCircle;
                return (
                  <div
                    key={req.id}
                    className={`bg-gray-800/50 border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRequest?.id === req.id
                        ? "border-yellow-500 shadow-lg shadow-yellow-500/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedRequest(req)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate">{req.subject}</h3>
                        <p className="text-sm text-gray-400">
                          {req.name || req.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                            {req.category}
                          </span>
                          <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[req.priority] || PRIORITY_COLORS.medium}`}>
                            {req.priority}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[req.status] || STATUS_COLORS.open}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span className="capitalize hidden sm:inline">{req.status.replace("-", " ")}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 mt-2">{req.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Request Details Panel */}
            {selectedRequest && (
              <div className="lg:col-span-1">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 sticky top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Request Details</h2>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{selectedRequest.subject}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                          {selectedRequest.category}
                        </span>
                        <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[selectedRequest.priority] || PRIORITY_COLORS.medium}`}>
                          {selectedRequest.priority}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">From</p>
                      <p className="text-sm">{selectedRequest.name || selectedRequest.email}</p>
                      <p className="text-xs text-gray-500">{selectedRequest.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <select
                        value={selectedRequest.status}
                        onChange={(e) => updateStatus(selectedRequest.id, e.target.value)}
                        disabled={updatingStatus === selectedRequest.id}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-2">Message</p>
                      <div className="bg-gray-900/50 rounded-lg p-3 text-sm text-gray-200 whitespace-pre-wrap">
                        {selectedRequest.message}
                      </div>
                    </div>

                    {selectedRequest.adminResponse && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Your Response</p>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-gray-200 whitespace-pre-wrap">
                          {selectedRequest.adminResponse}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-400 mb-2">Add Response</p>
                      <textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 h-24 resize-none text-sm"
                      />
                      <button
                        onClick={() => submitResponse(selectedRequest.id)}
                        disabled={!adminResponse.trim() || updatingStatus === selectedRequest.id}
                        className="mt-2 w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Response
                      </button>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-500">
                        Created: {new Date(selectedRequest.createdAt).toLocaleString()}
                      </p>
                      {selectedRequest.updatedAt && (
                        <p className="text-xs text-gray-500">
                          Updated: {new Date(selectedRequest.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
