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
  const [busy, setBusy] = useState(false);

  const teams = useMemo(() => (data?.teams ?? []) as any[], [data]);

  async function declareWinner(teamId: string) {
    if (!confirm("Mark this team as the winner and credit prize?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/tournaments/${params.id}/winner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Failed: " + (await res.text()));
      return;
    }
    alert("Winner recorded and prize credited.");
    mutate();
    router.refresh();
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

        {data.winners?.length > 0 ? (
          <div className="mb-6 p-4 rounded-lg bg-green-900/20 border border-green-800">
            <p className="text-green-300">Winner recorded.</p>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-lg bg-yellow-900/20 border border-yellow-800">
            <p className="text-yellow-300">No winner yet. Select one below and submit.</p>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="min-w-full bg-neutral-900 text-sm">
            <thead className="bg-neutral-800 text-gray-300">
              <tr>
                <th className="p-3 text-left">Select</th>
                <th className="p-3 text-left">Team / Player</th>
                <th className="p-3">Size</th>
                <th className="p-3">Captain</th>
                <th className="p-3 text-left">Members (Name • ID • Phone • Role)</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400">No registrations yet.</td>
                </tr>
              )}
              {teams.map((team: any) => {
                const captain = (team.members ?? []).find((m: any) => m.role === "captain");
                const players = (team.members ?? []).filter((m: any) => m.role !== "captain");
                return (
                <tr key={team.id} className="border-b border-neutral-800">
                  <td className="p-3 align-top">
                    {data.winners?.length === 0 && (
                      <input
                        type="radio"
                        name="winner"
                        checked={selectedTeamId === team.id}
                        onChange={() => setSelectedTeamId(team.id)}
                      />
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
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        {data.winners?.length === 0 && (
          <div className="mt-4 flex items-center gap-3">
            <button
              disabled={!selectedTeamId || busy}
              onClick={() => selectedTeamId && declareWinner(selectedTeamId)}
              className={`px-4 py-2 rounded font-semibold ${
                !selectedTeamId || busy ? "bg-gray-700 text-gray-500" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {busy ? "Submitting..." : "Confirm Winner"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


