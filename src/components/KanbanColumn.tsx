import { useDroppable } from "@dnd-kit/core";
import type { Application, ApplicationStatus } from "../types/application";
import { KanbanCard } from "./KanbanCard";

interface Props {
  status: ApplicationStatus;
  title: string;
  applications: Application[];
  onCardClick: (app: Application) => void;
}

export function KanbanColumn({
  status,
  title,
  applications,
  onCardClick,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-800 rounded-lg p-3 w-64 shrink-0 ${
        isOver ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <h3 className="text-gray-300 font-semibold text-sm mb-3 flex justify-between">
        {title}
        <span className="text-gray-500">{applications.length}</span>
      </h3>
      <div className="min-h-25">
        {applications.map((app) => (
          <KanbanCard
            key={app._id}
            application={app}
            onClick={() => onCardClick(app)}
          />
        ))}
      </div>
    </div>
  );
}