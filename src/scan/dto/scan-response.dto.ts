export class ScanResponseDto {
  id: string;
  projectId: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  performanceScore?: number;

  // Core Web Vitals
  fcp?: number;
  lcp?: number;
  cls?: number;
  tbt?: number;
  inp?: number;
  speedIndex?: number;

  // Asset metrics
  jsSizeKb?: number;
  cssSizeKb?: number;
  requestCount?: number;

  screenshotUrl?: string;
  recommendations: string[];
  errorMessage?: string;

  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
