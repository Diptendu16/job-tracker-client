import { useDraggable } from "@dnd-kit/core";
import { type Application } from "../types/application";
import { format } from "date-fns";

interface Props {
  application: Application;
  onClick: () => void;
}

export function KanbanCard({ application, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: application._id,
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={style}
      className={`bg-gray-700 rounded p-3 mb-2 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 z-50 relative" : ""
      }`}
    >
      <p className="font-semibold text-white text-sm">{application.company}</p>
      <p className="text-gray-300 text-xs">{application.role}</p>
      <p className="text-gray-400 text-xs mt-1">
        {format(new Date(application.appliedDate), "MMM d, yyyy")}
      </p>
    </div>
  );
}
