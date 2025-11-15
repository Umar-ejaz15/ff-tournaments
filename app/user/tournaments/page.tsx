"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TournamentJoinModal from "../components/TournamentJoinModal";
import useSWR from "swr";
import { Trophy, Coins, ArrowLeft, Users, Calendar, Filter } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  totalParticipants?: number;
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

  if (status === "loading") {
    return <LoadingSpinner message="Loading user data..." />;
  }

  if (tLoading || wLoading) {
    return <LoadingSpinner message="Loading tournaments..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/user"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-yellow-400 flex items-center gap-3">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
                Tournaments
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">Join Free Fire tournaments and compete for prizes!</p>
            </div>
            <div className="text-right bg-gray-900/50 border border-gray-800 rounded-xl p-3 sm:p-4 w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 mb-1">
                <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
                Your Balance
              </p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-400">{walletBalance} coins</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base sm:text-lg font-semibold text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Game Type</label>
              <div className="flex gap-2 flex-wrap">
                {(["all", "BR", "CS"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Mode</label>
              <div className="flex gap-2 flex-wrap">
                {(["all", "Solo", "Duo", "Squad"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setModeFilter(mode)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
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
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-yellow-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">{tournament.title}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        {tournament.gameType}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                        {tournament.mode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 shrink-0">
                      <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
                      Entry Fee
                    </span>
                    <span className="text-yellow-400 font-semibold text-right text-xs sm:text-sm">
                      {tournament.entryFee} coins/person
                      <br />
                      <span className="text-xs text-gray-400">
                        Total: {tournament.entryFee * (tournament.mode === "Solo" ? 1 : tournament.mode === "Duo" ? 2 : 4)} coins
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 shrink-0">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                      Prize Pool
                    </span>
                    <span className="text-green-400 font-semibold text-xs sm:text-sm">{tournament.prizePool} coins</span>
                  </div>
                  {tournament._count && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 shrink-0">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          Teams
                        </span>
                        <span className="text-white font-semibold text-xs sm:text-sm">{tournament._count.teams}</span>
                      </div>
                      {tournament.totalParticipants !== undefined && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 shrink-0">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                            Participants
                          </span>
                          <span className="text-white font-semibold text-xs sm:text-sm">{tournament.totalParticipants}</span>
                        </div>
                      )}
                    </>
                  )}
                  {tournament.startTime && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        Start Time
                      </span>
                      <span className="text-white text-xs sm:text-sm text-right">
                        {new Date(tournament.startTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {tournament.description && (
                  <p className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2">{tournament.description}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <Link href={`/user/tournaments/${tournament.id}`} className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm">
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
                      className={`w-full py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
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

