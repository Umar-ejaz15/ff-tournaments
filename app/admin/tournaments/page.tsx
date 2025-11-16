"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import type { Tournament } from "@prisma/client";
import { Trophy, Plus, Edit, Trash2, Eye, Settings, Users as UsersIcon, Coins, Calendar, Key } from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  });

export default function AdminTournamentsPage() {
  const { data, error, isLoading } = useSWR<Tournament[]>(
    "/api/admin/tournaments",
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  const [form, setForm] = useState({
    title: "",
    mode: "Solo",
    gameType: "BR",
    entryFee: "",
    prizePool: "",
    startTime: "",
    maxParticipants: "",
  });
  const [busy, setBusy] = useState(false);
  const [errMessage, setErrMessage] = useState<string | null>(null);

  async function createTournament(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrMessage(null);
    try {
      const payload = {
        ...form,
        entryFee: Number(form.entryFee) || 0,
        prizePool: Number(form.prizePool) || 0,
        maxParticipants: Number(form.maxParticipants) || 0,
      };

      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const newT = await res.json();
      mutate("/api/admin/tournaments", (prev: any) => [newT, ...(prev ?? [])], false);
      setForm({
        title: "",
        mode: "Solo",
        gameType: "BR",
        entryFee: "",
        prizePool: "",
        startTime: "",
        maxParticipants: "",
      });
    } catch (err: any) {
      setErrMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleOpen(id: string, isOpen: boolean) {
    const confirmMsg = isOpen
      ? "Are you sure you want to close this tournament?"
      : "Do you want to open this tournament for participants?";
    if (!confirm(confirmMsg)) return;

    const res = await fetch(`/api/admin/tournaments/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isOpen: !isOpen }),
    });
    if (res.ok) mutate("/api/admin/tournaments");
  }

  async function deleteTournament(id: string) {
    if (!confirm("Delete this tournament permanently?")) return;
    const prev = data;
    mutate("/api/admin/tournaments", prev?.filter((t) => t.id !== id) ?? [], false);
    const res = await fetch(`/api/admin/tournaments?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      mutate("/api/admin/tournaments", prev, false);
      alert("Delete failed: " + (await res.text()));
    } else {
      mutate("/api/admin/tournaments");
    }
  }

  async function updateTournament(id: string, updates: any) {
    const res = await fetch("/api/admin/tournaments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error(await res.text());
    mutate("/api/admin/tournaments");
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white p-8">
      <h1 className="text-2xl font-semibold mb-6 border-b border-gray-800 pb-2 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-400" />
        Admin Dashboard — Tournaments
      </h1>

      {/* Create Tournament Form */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8 shadow-lg">
        <h2 className="text-lg font-medium mb-4 text-yellow-400 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Tournament
        </h2>
        <form
          onSubmit={createTournament}
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Title</span>
            <input
              className="bg-gray-800 border border-gray-700 text-white p-2 rounded-lg outline-none focus:border-yellow-500/50"
              placeholder="Tournament title..."
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Mode</span>
            <select
              className="bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
              value={form.mode}
              onChange={(e) => setForm((s) => ({ ...s, mode: e.target.value }))}
            >
              <option>Solo</option>
              <option>Duo</option>
              <option>Squad</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Game Type</span>
            <select
              className="bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
              value={form.gameType}
              onChange={(e) => setForm((s) => ({ ...s, gameType: e.target.value }))}
            >
              <option value="BR">Battle Royale</option>
              <option value="CS">Clash Squad</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Entry Fee (coins)</span>
            <input
              type="number"
              className="bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
              placeholder="e.g. 50"
              value={form.entryFee}
              onChange={(e) =>
                setForm((s) => ({ ...s, entryFee: e.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Prize Pool (coins)</span>
            <input
              type="number"
              className="bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
              placeholder="e.g. 500"
              value={form.prizePool}
              onChange={(e) =>
                setForm((s) => ({ ...s, prizePool: e.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Start Time</span>
            <input
              type="datetime-local"
              className="bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
              value={form.startTime}
              onChange={(e) =>
                setForm((s) => ({ ...s, startTime: e.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-400">Max Participants</span>
            <input
              type="number"
              className="bg-gray-800 border border-gray-700 text-white p-2 rounded-lg"
              placeholder="e.g. 100"
              value={form.maxParticipants}
              onChange={(e) =>
                setForm((s) => ({ ...s, maxParticipants: e.target.value }))
              }
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy}
              className={`flex items-center justify-center gap-2 w-full ${
                busy ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"
              } transition rounded-lg py-2 font-semibold text-white`}
            >
              {busy ? (
                <>
                  <Settings className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Tournament
                </>
              )}
            </button>
          </div>
        </form>
        {errMessage && <p className="text-red-400 mt-3">{errMessage}</p>}
      </section>

      {/* Table */}
      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-medium mb-4 text-yellow-400 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          All Tournaments
        </h2>
        {isLoading && <div>Loading tournaments...</div>}
        {error && <div className="text-red-400">Failed to load tournaments.</div>}
        {!data || data.length === 0 ? (
          <div>No tournaments found.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800 shadow-lg">
            <table className="min-w-full bg-gray-900/50 text-sm">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Game</th>
                  <th className="p-3">Entry</th>
                  <th className="p-3">Prize</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Lobby Code</th>
                  <th className="p-3">Joinable</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition"
                  >
                    <td className="p-3">{t.title}</td>
                    <td className="p-3">{t.mode}</td>
                    <td className="p-3">{t.gameType}</td>
                    <td className="p-3">{t.entryFee}</td>
                    <td className="p-3">{t.prizePool}</td>
                    <td className="p-3">
                      <select
                        className="bg-neutral-800 p-2 rounded-lg text-sm"
                        value={t.status}
                        onChange={async (e) => {
                          try {
                            await updateTournament(t.id, { status: e.target.value });
                          } catch (err: any) {
                            alert("Update failed: " + err.message);
                          }
                        }}
                      >
                        <option value="upcoming">upcoming</option>
                        <option value="running">running</option>
                        <option value="ended">ended</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-400" />
                        <input
                          defaultValue={(t as any).lobbyCode || ""}
                          placeholder="Enter room code"
                          className="bg-gray-800 border border-gray-700 text-white p-2 rounded-lg text-sm w-32 focus:border-yellow-500/50 focus:outline-none"
                          onBlur={async (e) => {
                            const v = e.currentTarget.value.trim();
                            if (v && v !== (t as any).lobbyCode) {
                              try {
                                await updateTournament(t.id, { lobbyCode: v });
                                alert("✅ Lobby code updated! All participants will be notified via notifications.");
                              } catch (err: any) {
                                alert("❌ Lobby update failed: " + err.message);
                              }
                            }
                          }}
                        />
                      </div>
                      {(t as any).lobbyCode && (
                        <p className="text-xs text-green-400 mt-1">Active: {(t as any).lobbyCode}</p>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleOpen(t.id, t.isOpen)}
                        className={`px-3 py-1 rounded text-xs font-medium transition ${
                          t.isOpen
                            ? "bg-green-600/30 text-green-400 hover:bg-green-700/40"
                            : "bg-red-600/30 text-red-400 hover:bg-red-700/40"
                        }`}
                      >
                        {t.isOpen ? "Close Tournament" : "Open Tournament"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/tournaments/${t.id}`}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Manage
                        </Link>
                        <button
                          onClick={() => deleteTournament(t.id)}
                          className="flex items-center gap-1 text-red-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
