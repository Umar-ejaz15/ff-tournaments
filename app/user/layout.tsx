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

  // Enforce role-based access: only "user" role can access /user/*
  if (session.user.role === "admin") {
    redirect("/admin");
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
    redirect("/auth/signup");
  }

  // Extra safety: if user role in DB is not "user", redirect to admin
  // This prevents any admin account data from rendering under /user routes.
  if (user.role !== "user") {
    redirect("/admin");
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
