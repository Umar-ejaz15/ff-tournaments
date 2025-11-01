import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <p className="text-center mt-10">Please log in first.</p>;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { wallet: true },
  });

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-2">Profile</h2>
      <p><strong>Name:</strong> {user?.name}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Coins Balance:</strong> {user?.wallet?.balance ?? 0}</p>

      <div className="mt-4">
        <h3 className="font-medium">Recent Transactions</h3>
        <p className="text-gray-500">Coming soon...</p>
      </div>
    </div>
  );
}
