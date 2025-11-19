"use client";

import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, Users, Calendar, Coins, Copy, CheckCircle, Key } from "lucide-react";
import { useState } from "react";
import { calculatePrizeDistribution } from "@/lib/prize-distribution";
import { useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TournamentDetailPage() {
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated" && session?.user?.role === "admin";
  const params = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const { data, isLoading, error } = useSWR(
    params?.id ? `/api/tournaments/${params.id}` : null,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  const copyLobbyCode = async () => {
    if (!data?.lobbyCode) return;
    
    // Check if clipboard API is available
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(data.lobbyCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
        // Fallback for older browsers
        fallbackCopyTextToClipboard(data.lobbyCode);
      }
    } else {
      // Fallback for browsers without clipboard API
      fallbackCopyTextToClipboard(data.lobbyCode);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    if (typeof document === "undefined") return;
    
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    
    document.body.removeChild(textArea);
  };

  if (isLoading) return <div className="p-6 text-white">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">Failed to load</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/user/tournaments"
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tournaments
        </Link>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            {data.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-blue-400" />
              {data.gameType}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-purple-400" />
              {data.mode}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-yellow-400" />
              Entry: {data.entryFee} coins
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-green-400" />
              Prize: {data.prizePool} coins
            </span>
            {data.startTime && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-orange-400" />
                {new Date(data.startTime).toLocaleString()}
              </span>
            )}
          </div>
          {/* Prize Distribution */}
          {(() => {
            const distribution = calculatePrizeDistribution(data.prizePool);
            return (
              <div className="mt-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-400 mb-3">Prize Distribution</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Top 1</p>
                    <p className="text-xl font-bold text-yellow-400">{distribution.top1}</p>
                    <p className="text-xs text-gray-500 mt-1">({distribution.top1Percent}%)</p>
                  </div>
                  <div className="text-center p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Top 2</p>
                    <p className="text-xl font-bold text-gray-300">{distribution.top2}</p>
                    <p className="text-xs text-gray-500 mt-1">({distribution.top2Percent}%)</p>
                  </div>
                  <div className="text-center p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Top 3</p>
                    <p className="text-xl font-bold text-orange-400">{distribution.top3}</p>
                    <p className="text-xs text-gray-500 mt-1">({distribution.top3Percent}%)</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {data.lobbyCode && data.isParticipant && (
          <div className="mb-6 p-6 rounded-xl bg-linear-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-500/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400 mb-1">Room Code</p>
                  <p className="text-2xl font-bold text-white font-mono tracking-wider">
                    {data.lobbyCode}
                    <span className="ml-2 text-lg text-green-400 animate-pulse">●</span>
                  </p>
                </div>
              </div>
              <button
                onClick={copyLobbyCode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              ⚠️ Join the room using this code. Match will start soon!
            </p>
          </div>
        )}

        {data.lobbyPassword && (
          <div className="mb-6 p-6 rounded-xl bg-linear-to-r from-red-900/30 to-orange-900/30 border-2 border-red-500/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400 mb-1">Room Password</p>
                  <p className="text-2xl font-bold text-white font-mono tracking-wider">
                    {data.lobbyPassword}
                    <span className="ml-2 text-lg text-green-400 animate-pulse">●</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(data.lobbyPassword)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              ⚠️ Use this password to join the room.
            </p>
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
                    {isAdmin && (
                      <div className="text-xs text-gray-500">Team ID: {team.id}</div>
                    )}
                  </td>
                  <td className="p-3 align-top text-center">
                    <span className="inline-block px-2 py-1 bg-gray-800 rounded text-gray-300">
                      {team.members?.length ?? 0}
                    </span>
                  </td>
                  <td className="p-3 align-top">
                    <div className="text-white text-sm">{captain?.playerName || "-"}</div>
                    {isAdmin && captain?.gameId && (
                      <div className="text-xs text-gray-400">ID: {captain.gameId}</div>
                    )}
                    {isAdmin && captain?.phone && (
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
                            {isAdmin && m.gameId ? ` • ID: ${m.gameId}` : ""}
                            {isAdmin && m.phone ? ` • ${m.phone}` : ""}
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


