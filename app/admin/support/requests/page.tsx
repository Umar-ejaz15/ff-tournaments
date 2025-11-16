import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";

const FILE = path.join(process.cwd(), "data", "support-requests.json");

export const dynamic = "force-dynamic";

export default async function SupportRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "admin") redirect("/user");

  let list = [];
  try {
    const content = await fs.readFile(FILE, "utf8");
    list = JSON.parse(content || "[]");
  } catch (err) {
    console.error("Read support file error:", err);
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">Support Requests</h1>

        {list.length === 0 ? (
          <div className="text-gray-400">No requests yet.</div>
        ) : (
          <div className="space-y-4">
            {list.map((r: any) => (
              <div key={r.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{r.subject}</h3>
                    <p className="text-sm text-gray-400">From: {r.name || r.email}</p>
                    <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-sm text-yellow-400 font-medium">{r.status}</div>
                </div>
                <div className="mt-3 text-gray-200">{r.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
