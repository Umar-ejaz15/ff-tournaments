import LoadingSpinner from "@/components/LoadingSpinner";

// Loading UI for /user routes while server data (session / user) is being fetched
export default function Loading() {
  return (
    <LoadingSpinner message="Verifying your account and loading your dashboard..." />
  );
}
