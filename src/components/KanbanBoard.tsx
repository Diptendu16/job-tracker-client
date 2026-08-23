import { useState, useEffect, useCallback } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import type { Application, ApplicationStatus } from "../types/application";
import * as applicationApi from "../api/applicationApi";
import { KanbanColumn } from "./KanbanColumn";

const COLUMNS: { status: ApplicationStatus; title: string }[] = [
  { status: "APPLIED", title: "Applied" },
  { status: "OA", title: "OA" },
  { status: "INTERVIEW", title: "Interview" },
  { status: "OFFER", title: "Offer" },
  { status: "REJECTED", title: "Rejected" },
];

interface Props {
  workspaceId: string;
  onCardClick: (app: Application) => void;
  refreshKey: number;
  onStatusUpdated: () => void;
}

export function KanbanBoard({
  workspaceId,
  onCardClick,
  refreshKey,
  onStatusUpdated,
}: Props) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await applicationApi.fetchBoardApplications(workspaceId);
      setApplications(data);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard, refreshKey]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const applicationId = active.id as string;
    const newStatus = over.id as ApplicationStatus;

    const draggedApp = applications.find((a) => a._id === applicationId);
    if (!draggedApp || draggedApp.status === newStatus) return;

    const previousStatus = draggedApp.status;

    setApplications((prev) =>
      prev.map((a) =>
        a._id === applicationId ? { ...a, status: newStatus } : a,
      ),
    );
    setError("");

    try {
      await applicationApi.updateApplication(workspaceId, applicationId, {
        status: newStatus,
      });
      onStatusUpdated();
    } catch {
      setApplications((prev) =>
        prev.map((a) =>
          a._id === applicationId ? { ...a, status: previousStatus } : a,
        ),
      );
      setError(`Could not move "${draggedApp.company}" — please try again.`);
    }
  }

  if (loading) {
    return <p className="text-gray-400 text-center py-8">Loading board...</p>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-900/40 text-red-300 text-sm p-2 rounded mb-3">
          {error}
        </div>
      )}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              applications={applications.filter((a) => a.status === col.status)}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
