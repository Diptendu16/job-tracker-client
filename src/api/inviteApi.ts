import api from "./axios";
import type { InviteLink, InviteDetails } from "../types/invite";

export async function createInvite(workspaceId: string) {
  const res = await api.post(`/workspaces/${workspaceId}/invites`);
  return res.data.data as InviteLink;
}

export async function fetchInviteDetails(token: string) {
  const res = await api.get(`/invites/${token}`);
  return res.data.data as InviteDetails;
}

export async function acceptInvite(token: string) {
  const res = await api.post(`/invites/${token}/accept`);
  return res.data.data as { id: string; name: string };
}
