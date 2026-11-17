import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import type { ActivityEntry, ActivityEventPayload } from "../types/activity";
import type { ApplicationStatus } from "../types/application";
import * as activityApi from "../api/activityApi";
import { useSocketEvent } from "../hooks/useSocketEvent";

const MAX_ENTRIES = 30;

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  OA: "OA",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

function newestFirst(a: ActivityEntry, b: ActivityEntry) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

// Union by _id: the same entry arriving twice (event + fetch) collapses into one,
// and the feed stays correctly ordered whatever order things arrive in.
function mergeEntries(current: ActivityEntry[], incoming: ActivityEntry[]) {
  const byId = new Map<string, ActivityEntry>();
  [...current, ...incoming].forEach((entry) => byId.set(entry._id, entry));
  return Array.from(byId.values()).sort(newestFirst).slice(0, MAX_ENTRIES);
}

function describe(entry: ActivityEntry): string {
  const target = entry.application
    ? `${entry.application.company} (${entry.application.role})`
    : "an application";

  switch (entry.type) {
    case "APPLICATION_CREATED":
      return `added ${target}`;
    case "STATUS_CHANGED": {
      const from = entry.fromStatus ? STATUS_LABELS[entry.fromStatus] : "?";
      const to = entry.toStatus ? STATUS_LABELS[entry.toStatus] : "?";
      return `moved ${target} from ${from} to ${to}`;
    }
    case "APPLICATION_DELETED":
      return `deleted ${target}`;
    case "MEMBER_JOINED":
      return "joined the workspace";
  }
}

interface Props {
  workspaceId: string;
  refreshKey: number;
}

export function ActivityFeed({ workspaceId, refreshKey }: Props) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setTick] = useState(0);

  // Only the first load shows "Loading". Later refetches are silent and merge into what's there.
  const load = useCallback(async () => {
    try {
      const data = await activityApi.fetchActivity(workspaceId, MAX_ENTRIES);
      setEntries((prev) => mergeEntries(prev, data));
      setError("");
    } catch {
      setError("Could not load activity.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Re-render once a minute so "2 minutes ago" doesn't go stale on screen
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useSocketEvent<ActivityEventPayload>("activity.created", (payload) => {
    if (payload.workspaceId !== workspaceId) return;
    setEntries((prev) => mergeEntries(prev, [payload.activity]));
  });

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h2 className="font-semibold text-gray-300 mb-3">Activity</h2>

      {error && (
        <p className="text-red-300 text-sm mb-3">
          {error}{" "}
          <button onClick={load} className="underline ml-1">
            Retry
          </button>
        </p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading activity...</p>
      ) : entries.length === 0 && !error ? (
        <p className="text-gray-400 text-sm">
          No activity yet. Changes made in this workspace will show up here.
        </p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {entries.map((entry) => (
            <li key={entry._id} className="text-sm flex justify-between gap-4">
              <span className="text-gray-200">
                <span className="font-semibold text-white">
                  {entry.actor.userId === user?.id ? "You" : entry.actor.name}
                </span>{" "}
                {describe(entry)}
              </span>
              <span className="text-gray-500 text-xs whitespace-nowrap">
                {formatDistanceToNow(new Date(entry.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
