"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, Coins } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/user");
      }
    }
  }, [status, session, router]);

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* --- Hero Section --- */}
      <section className="flex flex-col items-center justify-center text-center py-32 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-extrabold mb-4 text-yellow-400"
        >
          Free Fire Championship 2025
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 max-w-2xl text-lg mb-8"
        >
          Join the ultimate Free Fire tournament. Compete with top squads,
          dominate the leaderboard, and win real rewards.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          <Link
            href="/tournaments"
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            Join Tournament <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 border border-gray-600 hover:bg-gray-800 rounded-xl transition-all"
          >
            Login / Signup
          </Link>
        </motion.div>
      </section>

      {/* --- Features Section --- */}
      <section className="py-24 px-6 bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          <FeatureCard
            icon={<Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-4" />}
            title="Compete & Win"
            desc="Play Solo, Duo, or Squad tournaments and earn exciting prizes."
          />
          <FeatureCard
            icon={<Users className="w-10 h-10 text-yellow-400 mx-auto mb-4" />}
            title="Join the Community"
            desc="Team up with skilled players and build your gaming reputation."
          />
          <FeatureCard
            icon={<Coins className="w-10 h-10 text-yellow-400 mx-auto mb-4" />}
            title="Earn Coins & Rewards"
            desc="Collect coins after each match to redeem in tournaments or prizes."
          />
        </div>
      </section>

      {/* --- Upcoming Tournament CTA --- */}
      <section className="py-28 px-6 text-center bg-gradient-to-t from-yellow-500/10 to-transparent">
        <h2 className="text-4xl font-bold mb-4">Ready for the next battle?</h2>
        <p className="text-gray-400 mb-8">
          Register now for upcoming Free Fire tournaments and showcase your
          skills to the world.
        </p>
        <Link
          href="/tournaments"
          className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-all"
        >
          View Upcoming Tournaments
        </Link>
      </section>

      {/* --- Footer --- */}
      <footer className="py-8 text-center border-t border-gray-800 text-gray-500 text-sm">
        © {new Date().getFullYear()} FF Tournaments • Powered by Next.js & Prisma
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-800 hover:border-yellow-500/50 transition-all">
      {icon}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}
