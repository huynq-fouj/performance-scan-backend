export class ProjectResponseDto {
  id: string;
  name: string;
  url: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  autoScanFrequency: string;
  lastScanAt?: Date;
  lastScore?: number;
  lastAccessibilityScore?: number;
  lastBestPracticesScore?: number;
  lastSeoScore?: number;
  lastScreenshot?: string;
  includeSeo?: boolean;
  includeAccessibility?: boolean;
  includeBestPractices?: boolean;
  storageItems?: { key: string; value: string }[];
  createdAt: Date;
  updatedAt: Date;
}
