import api from "./axios";
import type { ActivityEntry } from "../types/activity";

export async function fetchActivity(workspaceId: string, limit = 30) {
  const res = await api.get(`/workspaces/${workspaceId}/activity`, {
    params: { limit },
  });
  return res.data.data as ActivityEntry[];
}

export async function clearActivity(workspaceId: string) {
  await api.post(`/workspaces/${workspaceId}/activity/clear`);
}
