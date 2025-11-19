import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfilePage from "../../profile/page";
import DashboardClient from "./DashboardClient";
import JoinedTournamentsBar from "@/components/JoinedTournamentsBar";
import PushSubscriptionControl from "@/components/PushSubscriptionControl";

export const dynamic = "force-dynamic";

export default async function PlayerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      wallet: true,
      // Order TeamMember records newest-first so UI shows most recent joined tournaments
      teams: {
        orderBy: { id: "desc" },
        include: { team: { include: { tournament: true } } },
      },
    },
  });

  if (!user) {
    redirect("/auth/signup");
  }

  // Only allow users with role 'user' to view the player dashboard.
  if (user.role !== "user") {
    // If an admin visits this URL, send them to the admin dashboard.
    redirect("/admin");
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Player Dashboard</h1>
      <PushSubscriptionControl />
      <JoinedTournamentsBar user={user} />

      {/* Render joined tournament cards on the dashboard (show up to 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {(user?.teams ?? [])
          .map((tm: any) => tm.team?.tournament)
          .filter(Boolean)
          .slice(0, 3)
          .map((t: any) => (
            <div key={t.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{t.title}</h3>
                  <p className="text-xs text-gray-400 mb-2">{t.gameType} • {t.mode}</p>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">{t.description || "No description provided."}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">{t.prizePool} coins</p>
                  {t.startTime && <p className="text-xs text-gray-400">{new Date(t.startTime).toLocaleString()}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/user/tournaments/${t.id}`}
                  className="flex-1 text-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  View card
                </a>
                <a
                  href={`/user/tournaments/${t.id}`}
                  className="flex-1 text-center px-3 py-2 bg-transparent border border-gray-700 text-gray-300 rounded-lg text-sm"
                >
                  Manage / Details
                </a>
              </div>
            </div>
          ))}
      </div>

      <ProfilePage />
      <DashboardClient />
    </div>
  );
}
