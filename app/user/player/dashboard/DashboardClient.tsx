"use client";

import React from "react";

export default function DashboardClient() {
  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Welcome back!</h2>
          <p className="text-xs sm:text-sm text-gray-400">Quick actions</p>
        </div>
      </div>
    </div>
  );
}
