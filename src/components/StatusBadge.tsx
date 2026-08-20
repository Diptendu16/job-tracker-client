import { type ApplicationStatus } from "../types/application";

const statusStyles: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-500/20 text-blue-300",
  OA: "bg-yellow-500/20 text-yellow-300",
  INTERVIEW: "bg-purple-500/20 text-purple-300",
  OFFER: "bg-green-500/20 text-green-300",
  REJECTED: "bg-red-500/20 text-red-300",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
