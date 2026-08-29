export type ApplicationStatus =
  | "APPLIED"
  | "OA"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

export type ApplicationPlatform =
  | "INTERNSHALA"
  | "LINKEDIN"
  | "NAUKRI"
  | "COMPANY_WEBSITE"
  | "WELLFOUND"
  | "REFERRAL"
  | "CAMPUS_PLACEMENT"
  | "OTHER";

export interface Application {
  _id: string;
  workspace: string;
  createdBy: string;
  company: string;
  role: string;
  platform: ApplicationPlatform;
  status: ApplicationStatus;
  appliedDate: string;
  deadline?: string;
  oaDate?: string;
  interviewDate?: string;
  notes?: string;
  resumeVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApplicationFilters {
  page: number;
  status?: ApplicationStatus;
  platform?: ApplicationPlatform;
  company?: string;
  sortBy: "appliedDate" | "createdAt" | "deadline";
  order: "asc" | "desc";
}

export interface ApplicationFormData {
  company: string;
  role: string;
  platform: ApplicationPlatform;
  status: ApplicationStatus;
  appliedDate: string;
  deadline?: string;
  oaDate?: string;
  interviewDate?: string;
  notes?: string;
  resumeVersion?: string;
}
