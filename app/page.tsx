"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Trophy, Users, Coins } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getAllPaymentMethods } from "@/lib/payment-config";

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
      
      {/* --- Hero Section with background image --- */}
      <section className="relative h-[90vh] min-h-[520px] flex items-center">
        <Image
          src="/hero.jpg"
          alt="ZP Battle Zone tournament wallpaper"
          fill
          priority
          className="object-cover object-center"
        />

        {/* dark gradient overlay to keep text readable */}
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/45 to-black/70" />

        <div className="relative z-10 w-full px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight text-yellow-400 drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]"
            >
              ZP Battle Zone Championship 2025
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-gray-200 max-w-3xl mx-auto text-lg md:text-xl mb-4"
            >
              Join the ultimate ZP Battle Zone tournament platform. Compete in Solo, Duo, and Squad battles — win real prizes and climb the leaderboard.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base mb-6"
            >
              Fast matchmaking, transparent coin handling, and verified payouts — built for competitive players who want results.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link
                href="/auth/login"
                className="px-8 md:px-10 py-4 md:py-5 bg-linear-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-2xl flex items-center gap-3 transition-all shadow-2xl"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>

             
           
            </motion.div>
          </div>
        </div>

        {/* Decorative animated trophy/coin */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute right-8 bottom-8 hidden md:flex items-center gap-3"
          style={{ pointerEvents: "none" }}
        >
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border border-yellow-200 shadow-xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center border border-indigo-300 shadow-lg">
            <Coins className="w-6 h-6 text-white" />
          </div>
        </motion.div>
      </section>

      {/* --- Features Section --- */}
      <section className="min-h-[60vh] md:h-auto py-10 flex items-center px-6 bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col items-center mb-12">
            <Image
              src="/whychoseeus.jpg"
              alt="Why choose ZP Battle Zone"
              width={920}
              height={260}
              className="rounded-2xl object-cover mb-6 shadow-2xl"
            />
            <h2 className="text-3xl font-bold text-center text-white">
              Why Choose ZP Battle Zone?
            </h2>
          </div>
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
      <section className="relative min-h-[60vh] md:h-[90vh] px-6 bg-linear-to-b from-black via-gray-900 to-black">
        {/* Background image for prize pool section */}
        <Image
          src={encodeURI("/tournament ladning page section of prize pool.jpg")}
          alt="Tournament prize pools background"
          fill
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative max-w-4xl mx-auto text-center z-10 flex flex-col items-center justify-center h-full">
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
      <section className="relative min-h-[60vh] md:h-[90vh] px-6 bg-gray-950 border-t border-gray-800">
        {/* Payment section background image */}
        <Image
          src={encodeURI("/landing page payment section bg image.webp")}
          alt="payment background"
          fill
          className="object-cover object-center opacity-20"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative max-w-4xl mx-auto text-center z-10 flex flex-col items-center justify-center h-full">
          <h2 className="text-3xl font-bold mb-6 text-white">Easy Payment Options</h2>
          <p className="text-gray-400 mb-8">
            Support for multiple payment methods. Simply send payment, upload proof, and get verified!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {getAllPaymentMethods().map((pm) => (
              <div
                key={pm.method}
                className="px-6 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white font-medium"
              >
                {pm.name}
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
    <div className="bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-800 hover:border-yellow-500/50 transition-all flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 border border-yellow-500/20">
        <div className="w-10 h-10 text-yellow-400">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}
