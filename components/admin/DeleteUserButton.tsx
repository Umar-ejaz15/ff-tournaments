"use client";

import React, { useState } from "react";

export default function DeleteUserButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (disabled) return;
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      // Reload the page to show updated user list
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || "Failed to delete user");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy || disabled}
      className={`px-3 py-1 rounded-md text-sm font-medium ${busy || disabled ? "bg-gray-700 text-gray-300" : "bg-red-600 hover:bg-red-700 text-white"}`}
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}
