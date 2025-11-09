"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface TeamMember {
  playerName: string;
  phone: string;
  gameId: string;
  email?: string;
}

interface Tournament {
  id: string;
  title: string;
  mode: string;
  gameType: string;
  entryFee: number;
  prizePool: number;
}

export default function TournamentJoinModal({
  tournament,
  walletBalance,
  onClose,
}: {
  tournament: Tournament;
  walletBalance: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [captain, setCaptain] = useState<TeamMember>({ playerName: "", phone: "", gameId: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    // For Solo: no team members needed
    // For Duo: 1 team member (2 total including captain)
    // For Squad: 3 team members (4 total including captain)
    if (tournament.mode === "Solo") return [];
    if (tournament.mode === "Duo") return [{ playerName: "", phone: "", gameId: "", email: "" }];
    if (tournament.mode === "Squad")
      return [
        { playerName: "", phone: "", gameId: "", email: "" },
        { playerName: "", phone: "", gameId: "", email: "" },
        { playerName: "", phone: "", gameId: "", email: "" },
      ];
    return [];
  });

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!captain.playerName.trim() || !captain.phone.trim() || !captain.gameId.trim()) {
      setError("Captain details are required (name, phone, game id)");
      return;
    }
    if (tournament.mode !== "Solo" && !teamName.trim()) {
      setError("Team name is required");
      return;
    }

    if (tournament.mode !== "Solo") {
      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        if (!member.playerName.trim()) {
          setError(`Player ${i + 1} name is required`);
          return;
        }
        if (!member.phone.trim()) {
          setError(`Player ${i + 1} phone is required`);
          return;
        }
        if (!member.gameId.trim()) {
          setError(`Player ${i + 1} Free Fire Game ID is required`);
          return;
        }
      }
    }

    // Calculate total entry fee (entryFee per player * team size)
    const teamSize = tournament.mode === "Solo" ? 1 : tournament.mode === "Duo" ? 2 : 4;
    const totalEntryFee = tournament.entryFee * teamSize;
    
    if (walletBalance < totalEntryFee) {
      setError(`Insufficient coins. You need ${totalEntryFee} coins (${tournament.entryFee} per player × ${teamSize} players) for ${tournament.mode}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tournaments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament.id,
          teamName: tournament.mode === "Solo" ? undefined : teamName,
          teamMembers: tournament.mode === "Solo" ? [] : teamMembers,
          captain,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join tournament");
      }

      alert(`Successfully joined ${tournament.title}!`);
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">Join Tournament</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">{tournament.title}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Mode:</span>
              <span className="text-white ml-2 font-medium">{tournament.mode}</span>
            </div>
            <div>
              <span className="text-gray-400">Type:</span>
              <span className="text-white ml-2 font-medium">{tournament.gameType}</span>
            </div>
            <div>
              <span className="text-gray-400">Entry Fee:</span>
              <span className="text-yellow-400 ml-2 font-semibold">{tournament.entryFee} coins</span>
            </div>
            <div>
              <span className="text-gray-400">Prize Pool:</span>
              <span className="text-green-400 ml-2 font-semibold">{tournament.prizePool} coins</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Details (Captain)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Free Fire Name *</label>
                <input
                  type="text"
                  value={captain.playerName}
                  onChange={(e) => setCaptain((s) => ({ ...s, playerName: e.target.value }))}
                  placeholder="Your in-game name"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Free Fire Game ID *</label>
                <input
                  type="text"
                  value={captain.gameId}
                  onChange={(e) => setCaptain((s) => ({ ...s, gameId: e.target.value }))}
                  placeholder="e.g., 123456789"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={captain.phone}
                  onChange={(e) => setCaptain((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="03001234567"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={captain.email || ""}
                  onChange={(e) => setCaptain((s) => ({ ...s, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          </div>
          {tournament.mode !== "Solo" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                required
              />
            </div>
          )}

          {tournament.mode !== "Solo" && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Team Members ({tournament.mode === "Duo" ? "1 member" : "3 members"} + You)
              </h3>
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-yellow-400 mb-3">
                      Player {index + 1}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Free Fire Name *</label>
                        <input
                          type="text"
                          value={member.playerName}
                          onChange={(e) => updateTeamMember(index, "playerName", e.target.value)}
                          placeholder="Player in-game name"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Free Fire Game ID *</label>
                        <input
                          type="text"
                          value={member.gameId}
                          onChange={(e) => updateTeamMember(index, "gameId", e.target.value)}
                          placeholder="e.g., 123456789"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={member.phone}
                          onChange={(e) => updateTeamMember(index, "phone", e.target.value)}
                          placeholder="03001234567"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Email (Optional)</label>
                        <input
                          type="email"
                          value={member.email || ""}
                          onChange={(e) => updateTeamMember(index, "email", e.target.value)}
                          placeholder="player@example.com"
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading
                ? "Joining..."
                : (() => {
                    const teamSize = tournament.mode === "Solo" ? 1 : tournament.mode === "Duo" ? 2 : 4;
                    const totalEntry = tournament.entryFee * teamSize;
                    return `Join Tournament (${totalEntry} coins - ${tournament.entryFee} per player × ${teamSize})`;
                  })()}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

