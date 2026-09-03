import { type ApplicationStatus } from "./application";

export interface StatusDistributionItem {
  status: ApplicationStatus;
  count: number;
}

export interface WeeklyCount {
  label: string;
  count: number;
}

export interface RateMetrics {
  total: number;
  responseRate: number;
  reachedInterviewRate: number;
  rejectionRate: number;
  offerRate: number;
}

export interface AnalyticsData {
  statusDistribution: StatusDistributionItem[];
  applicationsPerWeek: WeeklyCount[];
  rates: RateMetrics;
}
