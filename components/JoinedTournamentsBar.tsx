import React from "react";
import Link from "next/link";
import { Trophy, Users } from "lucide-react";

export default function JoinedTournamentsBar({ user }: { user: any }) {
  const teams = user?.teams ?? [];
  const count = teams.length;
  const preview = teams.slice(0, 3).map((tm: any) => tm.team?.tournament?.title || tm.team?.name || "Team");

  return (
    <div className="w-full bg-gray-900/60 border border-gray-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-linear-to-r from-yellow-500 to-orange-400 p-3 rounded-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-300">Joined Tournaments</div>
            {count > 0 ? (
              <div>
                <div className="text-2xl font-bold text-yellow-400">{count} joined tournament{count !== 1 ? "s" : ""}</div>
                {preview.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">{preview.join(" • ")}</div>
                )}
              </div>
            ) : (
              <div className="text-2xl font-bold text-yellow-400">0 joined</div>
            )}
            {count === 0 && (
              <div className="text-xs text-gray-400 mt-2">You haven't joined any tournaments yet. Browse to join one.</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/user/tournaments"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Browse Tournaments
          </Link>
          <Link
            href="/user"
            className="px-3 py-2 bg-transparent border border-gray-700 text-gray-300 rounded-lg text-sm"
          >
            My Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
