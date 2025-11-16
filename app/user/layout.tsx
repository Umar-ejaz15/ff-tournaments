import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import JoinedTournamentsBar from "@/components/JoinedTournamentsBar";
import LoadingSpinner from "@/components/LoadingSpinner";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/auth/login");
  }


  // Fetch only minimal user fields here to keep layout fast. Heavy queries
  // (teams, transactions with lots of joins) will be fetched in child pages
  // where they are actually needed.
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      wallet: { select: { balance: true } },
    },
  });

  if (!user) {
    redirect("/auth/signup");
  }

  // Do not bluntly redirect here. Child pages should enforce role-specific access.
  // We still fetch the DB user to provide contextual data to `/user/*` pages.

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JoinedTournamentsBar user={user} />
        <div>{children}</div>
      </div>
    </div>
  );
}
