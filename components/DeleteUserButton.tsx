"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteUserButton({ userId, disabled, label }: { userId: string; disabled?: boolean; label?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (disabled) return;
    const ok = window.confirm(label ? `Delete ${label}? This is irreversible.` : "Delete this user? This is irreversible.");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || `Failed to delete user (${res.status})`;
        alert(msg);
        setLoading(false);
        return;
      }

      // refresh the page to reflect deletion
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
      }`}
    >
      <Trash2 className="w-4 h-4" />
      <span>{loading ? "Deleting..." : "Delete"}</span>
    </button>
  );
}
