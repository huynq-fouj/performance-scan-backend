export class ScanResponseDto {
  id: string;
  projectId: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  device?: 'mobile' | 'desktop';
  performanceScore?: number;

  // Core Web Vitals
  fcp?: number;
  lcp?: number;
  cls?: number;
  tbt?: number;
  inp?: number;
  speedIndex?: number;

  fcpScore?: number;
  lcpScore?: number;
  clsScore?: number;
  tbtScore?: number;
  speedIndexScore?: number;

  // Asset metrics
  jsSizeKb?: number;
  cssSizeKb?: number;
  requestCount?: number;

  screenshotUrl?: string;
  recommendations: string[];
  errorMessage?: string;

  // Populated project info (for global scans list)
  project?: { id: string; name: string; url: string };

  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
