import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import JoinedTournamentsBar from "@/components/JoinedTournamentsBar";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      wallet: true,
      teams: {
        include: {
          team: {
            include: { tournament: true, members: true },
          },
        },
        orderBy: { id: "desc" },
      },
      transactions: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) {
    // If user record not found even though session exists, force redirect to signup
    redirect("/auth/signup");
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JoinedTournamentsBar user={user} />
        <div>{children}</div>
      </div>
    </div>
  );
}
