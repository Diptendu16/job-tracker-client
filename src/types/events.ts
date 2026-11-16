import type { Application } from "./application";

export interface EventActor {
  id: string;
  name: string;
}

export interface ApplicationEventPayload {
  workspaceId: string;
  application: Application;
  actor: EventActor;
}

export interface ApplicationDeletedPayload {
  workspaceId: string;
  applicationId: string;
  actor: EventActor;
  deletedAt: string;
}
