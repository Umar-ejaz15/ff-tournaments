"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Megaphone, Plus, Edit, Trash2, Send, Users, Calendar, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  createdAt: string;
  createdBy: string;
}

export default function AnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    targetAudience: "all",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/user");
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(await res.text());
      mutate("/api/admin/announcements");
      setShowModal(false);
      setForm({ title: "", message: "", type: "info", targetAudience: "all" });
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
            <Megaphone className="w-8 h-8" />
            Announcements
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <p className="text-gray-400 text-sm">
            Create announcements to notify all users or specific groups about important updates, tournaments, or system changes.
          </p>
        </div>

        {/* Placeholder for announcements list */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400 text-lg mb-2">No announcements yet</p>
          <p className="text-gray-500 text-sm">Create your first announcement to notify users</p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                New Announcement
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm({ title: "", message: "", type: "info", targetAudience: "all" });
                }}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Message *</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                  rows={4}
                  placeholder="Announcement message"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="tournament">Tournament</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Audience</label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
                  >
                    <option value="all">All Users</option>
                    <option value="players">Players Only</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {busy ? "Sending..." : "Send Announcement"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ title: "", message: "", type: "info", targetAudience: "all" });
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

