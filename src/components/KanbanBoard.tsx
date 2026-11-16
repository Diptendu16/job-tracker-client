import { useState, useEffect, useCallback, useRef } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import type { Application, ApplicationStatus } from "../types/application";
import type {
  ApplicationEventPayload,
  ApplicationDeletedPayload,
} from "../types/events";
import * as applicationApi from "../api/applicationApi";
import { useSocketEvent } from "../hooks/useSocketEvent";
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
  onStatusUpdated: () => Promise<void>;
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
  // IDs deleted during this session, so a late "updated" event can't resurrect a deleted card.
  const deletedIdsRef = useRef<Set<string>>(new Set());

  // Only the first load shows "Loading board...". Later refetches are silent, so the board
  // doesn't flash. Dashboard remounts this component per workspace via key={workspace.id}.
  const loadBoard = useCallback(async () => {
    try {
      const data = await applicationApi.fetchBoardApplications(workspaceId);
      setApplications(data);
    } catch {
      setError("Could not load the board. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard, refreshKey]);

  function applyRemoteUpsert(incoming: Application) {
    if (deletedIdsRef.current.has(incoming._id)) return;

    setApplications((prev) => {
      const existing = prev.find((a) => a._id === incoming._id);

      // New card: insert at the top (the server sorts newest first).
      if (!existing) return [incoming, ...prev];

      // Older than what we already have: stale/out-of-order event, ignore it.
      if (new Date(incoming.updatedAt) < new Date(existing.updatedAt))
        return prev;

      // Same or newer: replace by _id. Applying the same event twice changes nothing.
      return prev.map((a) => (a._id === incoming._id ? incoming : a));
    });
  }

  useSocketEvent<ApplicationEventPayload>("application.created", (payload) => {
    if (payload.workspaceId === workspaceId)
      applyRemoteUpsert(payload.application);
  });

  useSocketEvent<ApplicationEventPayload>("application.updated", (payload) => {
    if (payload.workspaceId === workspaceId)
      applyRemoteUpsert(payload.application);
  });

  useSocketEvent<ApplicationDeletedPayload>(
    "application.deleted",
    (payload) => {
      if (payload.workspaceId !== workspaceId) return;
      deletedIdsRef.current.add(payload.applicationId);
      setApplications((prev) =>
        prev.filter((a) => a._id !== payload.applicationId),
      );
    },
  );

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
      onStatusUpdated().catch(() => {
        console.error("Failed to refresh other views after status update");
      });
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
