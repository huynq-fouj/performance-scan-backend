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
  createdAt: Date;
  updatedAt: Date;
}
