export interface ResumeVersion {
  _id: string;
  workspace: string;
  createdBy: string;
  name: string;
  url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeVersionFormData {
  name: string;
  url?: string;
  notes?: string;
}
