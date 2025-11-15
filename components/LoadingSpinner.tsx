"use client";

import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        <div className="text-lg text-gray-300">{message}</div>
      </div>
    </div>
  );
}

