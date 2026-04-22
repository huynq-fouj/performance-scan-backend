import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScanDocument = Scan & Document;

export interface ScanIssue {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric?: string;
  impact?: string;
}

export interface ScanRecommendation {
  title: string;
  expectedGain?: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ThirdPartyDomain {
  domain: string;
  transferSizeKb: number;
}

export interface AngularInsights {
  isAngular: boolean;
  version?: string;
  hasLazyRoutes?: boolean;
  heavyVendor?: boolean;
  ssrEnabled?: boolean;
  zoneJsPresent?: boolean;
}

@Schema({ timestamps: true })
export class Scan {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  })
  projectId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  // Job status
  @Prop({ default: 'queued', index: true })
  status: 'queued' | 'running' | 'success' | 'failed';

  @Prop({ default: 'mobile' })
  device: 'mobile' | 'desktop';

  // Main scores
  @Prop()
  performanceScore?: number;

  @Prop()
  accessibilityScore?: number;

  @Prop()
  bestPracticesScore?: number;

  @Prop()
  seoScore?: number;

  @Prop()
  angularScore?: number;

  @Prop()
  bundleScore?: number;

  // Core Web Vitals
  @Prop()
  fcp?: number;

  @Prop()
  lcp?: number;

  @Prop()
  cls?: number;

  @Prop()
  tbt?: number;

  @Prop()
  inp?: number;

  @Prop()
  speedIndex?: number;

  // Metric Scores (0-100)
  @Prop()
  fcpScore?: number;

  @Prop()
  lcpScore?: number;

  @Prop()
  clsScore?: number;

  @Prop()
  tbtScore?: number;

  @Prop()
  speedIndexScore?: number;

  // Asset metrics
  @Prop()
  jsSizeKb?: number;

  @Prop()
  cssSizeKb?: number;

  @Prop()
  imageSizeKb?: number;

  @Prop()
  fontSizeKb?: number;

  @Prop()
  otherSizeKb?: number;

  @Prop()
  requestCount?: number;

  @Prop({ type: Array, default: [] })
  thirdPartyDomains?: ThirdPartyDomain[];

  @Prop({ type: Object })
  angularInsights?: AngularInsights;

  // Screenshot
  @Prop()
  screenshotUrl?: string;

  // Issues found
  @Prop({ type: Array, default: [] })
  issues: ScanIssue[];

  // Recommendations
  @Prop({ type: Array, default: [] })
  recommendations: ScanRecommendation[];

  // Error
  @Prop()
  errorMessage?: string;

  // Timing
  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  // Raw lighthouse json (optional)
  @Prop({ type: Object })
  rawResult?: any;
}

export const ScanSchema = SchemaFactory.createForClass(Scan);