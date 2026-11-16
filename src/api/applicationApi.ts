import api from "./axios";
import type {
  Application,
  ApplicationFilters,
  ApplicationFormData,
  Pagination,
  NeedsAttentionItem,
} from "../types/application";
import { format } from "date-fns";

interface ListResponse {
  applications: Application[];
  pagination: Pagination;
}

export async function fetchApplications(
  workspaceId: string,
  filters: ApplicationFilters,
) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("sortBy", filters.sortBy);
  params.set("order", filters.order);
  if (filters.status) params.set("status", filters.status);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.company) params.set("company", filters.company);

  const res = await api.get(
    `/workspaces/${workspaceId}/applications?${params.toString()}`,
  );
  return res.data.data as ListResponse;
}

export async function fetchBoardApplications(workspaceId: string) {
  const res = await api.get(`/workspaces/${workspaceId}/applications/board`);
  return res.data.data as Application[];
}

export async function createApplication(
  workspaceId: string,
  data: ApplicationFormData,
) {
  const res = await api.post(`/workspaces/${workspaceId}/applications`, data);
  return res.data.data as Application;
}

export async function updateApplication(
  workspaceId: string,
  id: string,
  data: Partial<ApplicationFormData>,
) {
  const res = await api.patch(
    `/workspaces/${workspaceId}/applications/${id}`,
    data,
  );
  return res.data.data as Application;
}

export async function deleteApplication(workspaceId: string, id: string) {
  await api.delete(`/workspaces/${workspaceId}/applications/${id}`);
}

export async function fetchNeedsAttention(workspaceId: string) {
  // format() uses the browser's local time, so this is the user's own calendar date.
  // (toISOString() would give the UTC date, which is exactly the bug we're fixing.)
  const today = format(new Date(), "yyyy-MM-dd");
  const res = await api.get(
    `/workspaces/${workspaceId}/applications/needs-attention`,
    {
      params: { today },
    },
  );
  return res.data.data as NeedsAttentionItem[];
}
