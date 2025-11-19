"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, Coins } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/user/player/dashboard");
      }
    }
  }, [status, session, router]);

  // Show loading while checking session
  if (status === "loading") {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* --- Hero Section --- */}
      <section className="flex flex-col items-center justify-center text-center py-32 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-extrabold mb-6 text-yellow-400"
        >
          ZP Battle Zone Championship 2025
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 max-w-3xl text-xl mb-4"
        >
          Join the ultimate ZP Battle Zone tournament platform. Compete in Solo, Duo, and Squad battles.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 max-w-3xl text-lg mb-12"
        >
          Win real prizes, earn coins, and climb the leaderboard!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link
            href="/auth/login"
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* --- Features Section --- */}
      <section className="py-24 px-6 bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Why Choose ZP Battle Zone?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <FeatureCard
              icon={<Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />}
              title="Massive Prize Pools"
              desc="Compete for thousands of coins. Solo winners get 2500 coins, Duo teams 3200 coins, and Squad teams 3500 coins!"
            />
            <FeatureCard
              icon={<Users className="w-12 h-12 text-yellow-400 mx-auto mb-4" />}
              title="Multiple Game Modes"
              desc="Play Solo, Duo, or Squad Battle Royale matches. More modes coming soon!"
            />
            <FeatureCard
              icon={<Coins className="w-12 h-12 text-yellow-400 mx-auto mb-4" />}
              title="Easy Coin System"
              desc="Simple manual payment with EasyPaisa or NayaPay. Upload proof and get verified. 1 coin = Rs. 4"
            />
          </div>
        </div>
      </section>

      {/* --- Prize Pool Section --- */}
      <section className="py-24 px-6 bg-linear-to-b from-black via-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-yellow-400">Tournament Prize Pools</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Solo</h3>
              <div className="text-3xl font-bold text-yellow-400 mb-2">5000 Coins</div>
              <p className="text-gray-400 text-sm">Top 1: 2500 coins</p>
              <p className="text-gray-400 text-sm">Entry: 50 coins</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Duo</h3>
              <div className="text-3xl font-bold text-yellow-400 mb-2">6200 Coins</div>
              <p className="text-gray-400 text-sm">Top 1: 3200 coins</p>
              <p className="text-gray-400 text-sm">Entry: 100 coins</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Squad</h3>
              <div className="text-3xl font-bold text-yellow-400 mb-2">7000 Coins</div>
              <p className="text-gray-400 text-sm">Top 1: 3500 coins</p>
              <p className="text-gray-400 text-sm">Entry: 200 coins</p>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all inline-flex items-center gap-2 shadow-lg"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* --- Payment Methods Section --- */}
      <section className="py-20 px-6 bg-gray-950 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Easy Payment Options</h2>
          <p className="text-gray-400 mb-8">
            Support for multiple payment methods. Simply send payment, upload proof, and get verified!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["EasyPaisa", "NayaPay"].map((method) => (
              <div
                key={method}
                className="px-6 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white font-medium"
              >
                {method}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-8 text-center border-t border-gray-800 text-gray-500 text-sm">
        © {new Date().getFullYear()} ZP Battle Zone • Powered by Next.js & Prisma
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
