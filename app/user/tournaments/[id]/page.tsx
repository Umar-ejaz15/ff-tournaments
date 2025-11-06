"use client";

import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useSWR(
    params?.id ? `/api/tournaments/${params.id}` : null,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  if (isLoading) return <div className="p-6 text-white">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">Failed to load</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/user/tournaments" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Tournaments
        </Link>
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">{data.title}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {data.gameType} • {data.mode} • Entry {data.entryFee} • Prize {data.prizePool}
        </p>

        {data.lobbyCode && (
          <div className="mb-6 p-4 rounded-lg bg-blue-900/20 border border-blue-800">
            <p className="text-blue-300">Room Code: {data.lobbyCode}</p>
          </div>
        )}

        {data.winners?.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-green-900/20 border border-green-800">
            <p className="text-green-300">Winner has been declared.</p>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="min-w-full bg-gray-900/50 text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-3 text-left">Team / Player</th>
                <th className="p-3">Size</th>
                <th className="p-3">Captain</th>
                <th className="p-3 text-left">Members</th>
              </tr>
            </thead>
            <tbody>
              {(data.teams ?? []).map((team: any) => {
                const captain = (team.members ?? []).find((m: any) => m.role === "captain");
                const players = (team.members ?? []).filter((m: any) => m.role !== "captain");
                return (
                <tr key={team.id} className="border-b border-gray-800">
                  <td className="p-3 align-top">
                    <div className="font-medium text-white">{team.name}</div>
                    <div className="text-xs text-gray-500">Team ID: {team.id}</div>
                  </td>
                  <td className="p-3 align-top text-center">
                    <span className="inline-block px-2 py-1 bg-gray-800 rounded text-gray-300">
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
                  </td>
                  <td className="p-3 align-top">
                    {players.length > 0 ? (
                      <ul className="list-disc ml-5 space-y-1 text-gray-300">
                        {players.map((m: any, idx: number) => (
                          <li key={m.id}>
                            <span className="text-gray-500">{idx + 1}.</span>{" "}
                            <span className="text-white">{m.playerName || "User"}</span>
                            {m.gameId ? ` • ID: ${m.gameId}` : ""}
                            {m.phone ? ` • ${m.phone}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">No members</span>
                    )}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


