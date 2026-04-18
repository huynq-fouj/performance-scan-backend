import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScanDocument = Scan & Document;

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

  // Asset metrics
  @Prop()
  jsSizeKb?: number;

  @Prop()
  cssSizeKb?: number;

  @Prop()
  requestCount?: number;

  // Screenshot
  @Prop()
  screenshotUrl?: string;

  // Recommendations
  @Prop({ type: [String], default: [] })
  recommendations: string[];

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