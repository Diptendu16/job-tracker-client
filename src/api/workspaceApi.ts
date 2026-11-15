import api from "./axios";
import { type WorkspaceSummary } from "../types/workspace";

export async function fetchMyWorkspaces() {
  const res = await api.get("/workspaces");
  return res.data.data as WorkspaceSummary[];
}
