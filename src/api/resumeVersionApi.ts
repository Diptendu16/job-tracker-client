import api from "./axios";
import type {
  ResumeVersion,
  ResumeVersionFormData,
} from "../types/resumeVersion";

export async function fetchResumeVersions(workspaceId: string) {
  const res = await api.get(`/workspaces/${workspaceId}/resume-versions`);
  return res.data.data as ResumeVersion[];
}

export async function createResumeVersion(
  workspaceId: string,
  data: ResumeVersionFormData,
) {
  const res = await api.post(
    `/workspaces/${workspaceId}/resume-versions`,
    data,
  );
  return res.data.data as ResumeVersion;
}

export async function deleteResumeVersion(workspaceId: string, id: string) {
  await api.delete(`/workspaces/${workspaceId}/resume-versions/${id}`);
}
