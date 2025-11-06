"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TournamentJoinModal from "../components/TournamentJoinModal";
import useSWR from "swr";

interface Tournament {
  id: string;
  title: string;
  mode: string;
  gameType: string;
  entryFee: number;
  prizePool: number;
  description?: string;
  startTime?: string;
  status: string;
  _count?: { teams: number };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TournamentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: tournamentsRes, isLoading: tLoading } = useSWR<Tournament[]>(
    status === "authenticated" ? "/api/tournaments" : null,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  const { data: walletRes, isLoading: wLoading, mutate: refreshWallet } = useSWR<{ balance: number }>(
    status === "authenticated" ? "/api/user/wallet" : null,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  const [filter, setFilter] = useState<"all" | "BR" | "CS">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "Solo" | "Duo" | "Squad">("all");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  const walletBalance = walletRes?.balance ?? 0;
  const tournaments = tournamentsRes ?? [];
  const filteredTournaments = useMemo(() => tournaments.filter((t) => {
    if (filter !== "all" && t.gameType !== filter) return false;
    if (modeFilter !== "all" && t.mode !== modeFilter) return false;
    return t.status === "upcoming";
  }), [tournaments, filter, modeFilter]);

  if (tLoading || wLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/user"
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-yellow-400">🏆 Tournaments</h1>
              <p className="text-gray-400">Join Free Fire tournaments and compete for prizes!</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Your Balance</p>
              <p className="text-2xl font-bold text-yellow-400">{walletBalance} coins</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Game Type</label>
              <div className="flex gap-2">
                {(["all", "BR", "CS"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === type
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {type === "all" ? "All" : type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mode</label>
              <div className="flex gap-2 flex-wrap">
                {(["all", "Solo", "Duo", "Squad"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setModeFilter(mode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      modeFilter === mode
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {mode === "all" ? "All" : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{tournament.title}</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        {tournament.gameType}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                        {tournament.mode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Entry Fee</span>
                    <span className="text-yellow-400 font-semibold">{tournament.entryFee} coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Prize Pool</span>
                    <span className="text-green-400 font-semibold">{tournament.prizePool} coins</span>
                  </div>
                  {tournament._count && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Participants</span>
                      <span className="text-white font-semibold">{tournament._count.teams}</span>
                    </div>
                  )}
                </div>

                {tournament.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <Link href={`/user/tournaments/${tournament.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                    View details
                  </Link>
                </div>

                {(() => {
                  const multiplier = tournament.mode === "Solo" ? 1 : tournament.mode === "Duo" ? 2 : 4;
                  const totalEntry = tournament.entryFee * multiplier;
                  const need = Math.max(0, totalEntry - walletBalance);
                  const disabled = walletBalance < totalEntry;
                  return (
                    <button
                      onClick={() => setSelectedTournament(tournament)}
                      disabled={disabled}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        disabled
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-400 text-black"
                      }`}
                    >
                      {disabled
                        ? `Need ${need} more coins (Total: ${totalEntry})`
                        : `Join Tournament (${totalEntry} coins)`}
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No tournaments available</p>
            <p className="text-gray-500 text-sm">Check back later for new tournaments!</p>
          </div>
        )}
      </div>

      {selectedTournament && (
        <TournamentJoinModal
          tournament={selectedTournament}
          walletBalance={walletBalance}
          onClose={() => {
            setSelectedTournament(null);
            refreshWallet();
          }}
        />
      )}
    </div>
  );
}

