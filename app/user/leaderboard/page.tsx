"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import { Trophy, Medal, Award, Users, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LeaderboardEntry {
  user: {
    id: string;
    name: string;
    email: string;
    wins: number;
    starEligible: boolean;
  };
  totalWins: number;
  totalCoins: number;
  tournamentsPlayed: number;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: leaderboard = [], isLoading } = useSWR<LeaderboardEntry[]>(
    status === "authenticated" ? "/api/user/leaderboard" : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/user"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 inline-block transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-yellow-400 flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            Leaderboard
          </h1>
          <p className="text-gray-400">Top players ranked by tournament wins</p>
        </div>

        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
              <p className="text-gray-400 text-lg mb-2">No leaderboard data yet</p>
              <p className="text-gray-500 text-sm">Start playing tournaments to appear on the leaderboard!</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const isTopThree = index < 3;
              const isCurrentUser = session?.user?.email === entry.user.email;
              
              return (
                <div
                  key={entry.user.id}
                  className={`bg-gray-900/50 border rounded-xl p-6 transition-all ${
                    isTopThree
                      ? "border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                      : "border-gray-800"
                  } ${isCurrentUser ? "ring-2 ring-blue-500/50" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      {index === 0 ? (
                        <Medal className="w-10 h-10 text-yellow-400" />
                      ) : index === 1 ? (
                        <Award className="w-10 h-10 text-gray-300" />
                      ) : index === 2 ? (
                        <Trophy className="w-10 h-10 text-orange-400" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {entry.user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-sm text-blue-400">(You)</span>
                          )}
                        </h3>
                        {entry.user.starEligible && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                            ⭐ Star Player
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-400">Wins:</span>
                          <span className="text-white font-semibold">{entry.totalWins}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-gray-400">Tournaments:</span>
                          <span className="text-white font-semibold">{entry.tournamentsPlayed}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-400">Coins Earned:</span>
                          <span className="text-white font-semibold">{entry.totalCoins}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

