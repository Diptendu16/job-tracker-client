import type { ApplicationStatus } from "./application";

export type ActivityType =
  | "APPLICATION_CREATED"
  | "STATUS_CHANGED"
  | "APPLICATION_DELETED"
  | "MEMBER_JOINED";

export interface ActivityEntry {
  _id: string;
  workspace: string;
  actor: { userId: string; name: string };
  type: ActivityType;
  application?: { applicationId: string; company: string; role: string };
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  createdAt: string;
}

export interface ActivityEventPayload {
  workspaceId: string;
  activity: ActivityEntry;
}
