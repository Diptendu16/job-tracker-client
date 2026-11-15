export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: MembershipRole;
  isPersonal: boolean;
}
