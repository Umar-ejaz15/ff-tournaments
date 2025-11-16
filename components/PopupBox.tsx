"use client";

import React from "react";

export default function PopupBox({
  title,
  children,
  onClose,
}: {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-gray-900 rounded-lg border border-gray-800 max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title ?? "Info"}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-1 rounded"
            aria-label="Close popup"
          >
            ✕
          </button>
        </div>

        <div className="text-sm text-gray-300">{children}</div>
      </div>
    </div>
  );
}
