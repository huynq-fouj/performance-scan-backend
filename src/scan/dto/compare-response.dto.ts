import { ScanResponseDto } from './scan-response.dto';

export class DeltaMetric {
  diff: number;
  percent: number;
  isBetter: boolean;
}

export class ScanCompareResponseDto {
  scanA: ScanResponseDto;
  scanB: ScanResponseDto;
  deltas: {
    performanceScore: DeltaMetric;
    lcp: DeltaMetric;
    cls: DeltaMetric;
    tbt: DeltaMetric;
    jsSizeKb: DeltaMetric;
    cssSizeKb: DeltaMetric;
    requestCount: DeltaMetric;
  };
  summary: string;
}
