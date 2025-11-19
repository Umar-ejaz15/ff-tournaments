"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SupportBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    async function fetchCount() {
      try {
        const res = await fetch("/api/support");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const unviewed = (data || []).filter((r: any) => !r.viewed).length;
        setCount(unviewed);
      } catch (err) {
        console.error("Failed to fetch support count:", err);
      }
    }

    fetchCount();
    const iv = setInterval(fetchCount, 30_000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  if (count === 0) return null;

  return (
    <Link href="/admin/support/requests" className="relative">
      <div className="px-3 py-2 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-gray-800 flex items-center gap-1">
        Support
        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
          {count}
        </span>
      </div>
    </Link>
  );
}
