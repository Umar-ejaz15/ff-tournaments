"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "OAuthAccountNotLinked":
        return "An account with this email already exists. Please sign in with your original method (email/password) or use a different Google account.";
      default:
        return error 
          ? `An error occurred: ${error}` 
          : "An error occurred during authentication.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-red-400">Authentication Error</h1>
        <p className="text-gray-300">{getErrorMessage(error)}</p>
        {error && (
          <p className="text-sm text-gray-500">Error code: {error}</p>
        )}
        <Link
          href="/auth/login"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          Try Again
        </Link>
        <Link
          href="/"
          className="inline-block px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}

