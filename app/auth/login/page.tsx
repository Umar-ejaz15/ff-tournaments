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

  const rawCallbackUrl = searchParams?.get("callbackUrl") || "";
  const callbackUrl = rawCallbackUrl
    ? decodeURIComponent(rawCallbackUrl).replace(/^https?:\/\/[^/]+/, "") || "/user"
    : "/user";

  const redirectUser = () => {
    if (!session?.user?.role) return;
    let targetUrl = "/user";
    const userRole = session.user.role.toLowerCase();
    
    if (userRole === "admin") {
      targetUrl = "/admin";
    } else if (callbackUrl.startsWith("/user")) {
      targetUrl = callbackUrl;
    }
    window.location.href = targetUrl;
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      redirectUser();
    }
  }, [status, session, callbackUrl]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has("code");
    const hasError = urlParams.has("error");

    if (hasError) {
      const errorMsg = urlParams.get("error");
      setError(`Login failed: ${errorMsg || "Unknown error"}`);
      setIsGoogleLoading(false);
      window.history.replaceState({}, "", "/auth/login");
      return;
    }

    if (hasCode && status === "unauthenticated") {
      setIsGoogleLoading(true);
      let attempts = 0;
      const maxAttempts = 20;

      const checkSession = async () => {
        try {
          await update();
          const res = await fetch("/api/auth/session", {
            cache: "no-store",
            credentials: "include",
          });
          const data = await res.json();

          if (data?.user?.role) {
            window.location.reload();
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkSession, 300);
          } else {
            setError("Session creation timed out. Please try again.");
            setIsGoogleLoading(false);
            window.history.replaceState({}, "", "/auth/login");
          }
        } catch (err) {
          console.error("Session check error:", err);
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkSession, 300);
          } else {
            setError("Failed to create session. Please try again.");
            setIsGoogleLoading(false);
            window.history.replaceState({}, "", "/auth/login");
          }
        }
      };

      setTimeout(checkSession, 500);
    }
  }, [status, update]);

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

      if (result?.ok) {
        // Wait a bit for session to be created
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force session update
        await update();
        
        // Fetch session with retry logic to ensure role is available
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkSession = async (): Promise<void> => {
          try {
            const res = await fetch("/api/auth/session", {
              cache: "no-store",
              credentials: "include",
            });
            const data = await res.json();

            if (data?.user?.role) {
              // Role is available, redirect based on role
              const userRole = data.user.role.toLowerCase();
              
              if (userRole === "admin") {
                window.location.href = "/admin";
              } else {
                const targetUrl = callbackUrl.startsWith("/user") ? callbackUrl : "/user";
                window.location.href = targetUrl;
              }
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkSession, 300);
            } else {
              setError("Failed to get user role. Please try again.");
              setIsLoading(false);
            }
          } catch (err) {
            console.error("Session check error:", err);
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkSession, 300);
            } else {
              setError("Failed to verify session. Please try again.");
              setIsLoading(false);
            }
          }
        };

        checkSession();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await signIn("google", {
        callbackUrl: `${window.location.origin}/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
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
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
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
