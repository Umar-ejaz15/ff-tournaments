"use client";

import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminTournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error, mutate } = useSWR(
    params?.id ? `/api/tournaments/${params.id}` : null,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedPlacement, setSelectedPlacement] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);

  const teams = useMemo(() => (data?.teams ?? []) as any[], [data]);
  const winners = useMemo(() => (data?.winners ?? []) as any[], [data]);
  const takenPlacements = useMemo(() => winners.map((w: any) => w.placement), [winners]);
  const availablePlacements = [1, 2, 3].filter((p) => !takenPlacements.includes(p));

  async function declareWinner(teamId: string, placement: 1 | 2 | 3) {
    const placementText = placement === 1 ? "1st (Top 1)" : placement === 2 ? "2nd (Top 2)" : "3rd (Top 3)";
    if (!confirm(`Mark this team as ${placementText} and credit prize?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${params.id}/winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, placement }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        alert("Failed: " + errorText);
        return;
      }
      alert(`${placementText} recorded and prize credited.`);
      setSelectedTeamId("");
      mutate();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="p-6 text-white">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">Failed to load</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">{data.title}</h1>
        <div className="text-sm text-gray-300 mb-6 flex flex-wrap gap-4">
          <span>Game: <span className="text-gray-100 font-medium">{data.gameType}</span></span>
          <span>Mode: <span className="text-gray-100 font-medium">{data.mode}</span></span>
          <span>Entry/team: <span className="text-yellow-300 font-semibold">{data.entryFee}</span></span>
          <span>Prize: <span className="text-green-300 font-semibold">{data.prizePool}</span></span>
          <span>Registrations: <span className="text-gray-100 font-medium">{data._count?.teams ?? 0}</span></span>
        </div>

        {/* Winners Status */}
        <div className="mb-6 p-4 rounded-lg border border-gray-800 bg-gray-900/50">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">Winners Status</h3>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((placement) => {
              const winner = winners.find((w: any) => w.placement === placement);
              const team = winner ? teams.find((t: any) => t.id === winner.teamId) : null;
              const captain = team ? (team.members ?? []).find((m: any) => m.role === "captain") : null;
              return (
                <div
                  key={placement}
                  className={`p-3 rounded-lg border ${
                    winner
                      ? "bg-green-900/20 border-green-800"
                      : "bg-gray-800/50 border-gray-700"
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">
                    {placement === 1 ? "🥇 Top 1" : placement === 2 ? "🥈 Top 2" : "🥉 Top 3"}
                  </div>
                  {winner ? (
                    <div className="text-xs text-gray-300">
                      <div>{captain?.playerName || "Unknown"}</div>
                      <div className="text-green-400 font-medium">{winner.rewardCoins} coins</div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Not assigned</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="min-w-full bg-neutral-900 text-sm">
            <thead className="bg-neutral-800 text-gray-300">
              <tr>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Team / Player</th>
                <th className="p-3">Size</th>
                <th className="p-3">Captain</th>
                <th className="p-3 text-left">Members (Name • ID • Phone • Role)</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">No registrations yet.</td>
                </tr>
              )}
              {teams.map((team: any) => {
                const captain = (team.members ?? []).find((m: any) => m.role === "captain");
                const players = (team.members ?? []).filter((m: any) => m.role !== "captain");
                const isWinner = winners.some((w: any) => w.teamId === team.id);
                const winnerPlacement = isWinner ? winners.find((w: any) => w.teamId === team.id)?.placement : null;
                return (
                <tr key={team.id} className="border-b border-neutral-800">
                  <td className="p-3 align-top">
                    {!isWinner && availablePlacements.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <input
                          type="radio"
                          name="winner"
                          checked={selectedTeamId === team.id}
                          onChange={() => setSelectedTeamId(team.id)}
                        />
                        {selectedTeamId === team.id && (
                          <select
                            className="text-xs bg-gray-800 p-1 rounded"
                            value={selectedPlacement}
                            onChange={(e) => setSelectedPlacement(Number(e.target.value) as 1 | 2 | 3)}
                          >
                            {availablePlacements.map((p) => (
                              <option key={p} value={p}>
                                {p === 1 ? "🥇 Top 1" : p === 2 ? "🥈 Top 2" : "🥉 Top 3"}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <div className="font-medium text-white">{team.name}</div>
                    <div className="text-xs text-gray-500">Team ID: {team.id}</div>
                  </td>
                  <td className="p-3 align-top text-center">
                    <span className="inline-block px-2 py-1 bg-neutral-800 rounded text-gray-300">
                      {team.members?.length ?? 0}
                    </span>
                  </td>
                  <td className="p-3 align-top">
                    <div className="text-white text-sm">{captain?.playerName || "-"}</div>
                    {captain?.gameId && (
                      <div className="text-xs text-gray-400">ID: {captain.gameId}</div>
                    )}
                    {captain?.phone && (
                      <div className="text-xs text-gray-400">{captain.phone}</div>
                    )}
                    <div className="text-xs text-gray-500">Captain ID: {team.captainId}</div>
                  </td>
                  <td className="p-3 align-top">
                    {players.length > 0 ? (
                      <div className="grid gap-1">
                        {players.map((m: any, idx: number) => (
                          <div key={m.id} className="text-gray-300">
                            <span className="text-gray-500">{idx + 1}.</span>{" "}
                            <span className="text-white">{m.playerName || "User"}</span>
                            {m.gameId ? ` • ID: ${m.gameId}` : ""}
                            {m.phone ? ` • ${m.phone}` : ""}
                            {m.role ? ` • ${m.role}` : ""}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No members</span>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    {isWinner ? (
                      <span className="inline-block px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-semibold">
                        {winnerPlacement === 1 ? "🥇 Top 1" : winnerPlacement === 2 ? "🥈 Top 2" : "🥉 Top 3"}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">Not placed</span>
                    )}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        {availablePlacements.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <button
              disabled={!selectedTeamId || busy}
              onClick={() => selectedTeamId && declareWinner(selectedTeamId, selectedPlacement)}
              className={`px-4 py-2 rounded font-semibold ${
                !selectedTeamId || busy ? "bg-gray-700 text-gray-500" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {busy ? "Submitting..." : `Confirm ${selectedPlacement === 1 ? "Top 1" : selectedPlacement === 2 ? "Top 2" : "Top 3"}`}
            </button>
            {selectedTeamId && (
              <span className="text-sm text-gray-400">
                Selected: {selectedPlacement === 1 ? "🥇 Top 1" : selectedPlacement === 2 ? "🥈 Top 2" : "🥉 Top 3"}
              </span>
            )}
          </div>
        )}
        {availablePlacements.length === 0 && winners.length === 3 && (
          <div className="mt-4 p-4 rounded-lg bg-green-900/20 border border-green-800">
            <p className="text-green-300">✅ All placements (Top 1, 2, 3) have been assigned. Tournament complete!</p>
          </div>
        )}
      </div>
    </div>
  );
}


