"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Get callback URL safely
  const rawCallbackUrl = searchParams?.get("callbackUrl") || "";
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/")
      ? rawCallbackUrl
      : "/user";

  // Redirect user if session is already authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role.toLowerCase();
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push(callbackUrl);
      }
    }
  }, [status, session, callbackUrl, router]);

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Force session update
      await update();

      // Redirect after session is ready
      const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role?.toLowerCase();

      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push(callbackUrl);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      // Force relative URL to stay in localhost during dev
      await signIn("google", {
        callbackUrl: callbackUrl,
      });
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err?.message || "Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  if (status === "loading" || isLoading || isGoogleLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
        <div className="text-lg mb-2">Loading...</div>
        <div className="text-sm text-gray-400">Please wait</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900/50 text-gray-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
        >
          {isGoogleLoading ? "Redirecting..." : "Sign in with Google"}
        </button>
        

        <p className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-blue-500 hover:text-blue-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
