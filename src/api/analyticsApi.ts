import api from "./axios";
import { type AnalyticsData } from "../types/analytics";

export async function fetchAnalytics(workspaceId: string) {
  const res = await api.get(`/workspaces/${workspaceId}/analytics`);
  return res.data.data as AnalyticsData;
}
