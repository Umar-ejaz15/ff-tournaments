import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminBoardRedirect() {
  // Keep this route as a friendly alias for /admin
  redirect("/admin");
}
