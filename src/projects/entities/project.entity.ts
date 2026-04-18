import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  // Display
  @Prop({ required: true })
  name: string;

  // URL to scan
  @Prop({ required: true })
  url: string;

  // Optional metadata
  @Prop()
  description?: string;

  @Prop()
  logo?: string;

  // Settings
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 'weekly' })
  autoScanFrequency: 'manual' | 'daily' | 'weekly' | 'monthly';

  @Prop({ default: true })
  includeSeo: boolean;

  @Prop({ default: true })
  includeAccessibility: boolean;

  @Prop({ default: true })
  includeBestPractices: boolean;

  // Last scan quick access
  @Prop()
  lastScanAt?: Date;

  @Prop()
  lastScore?: number;

  @Prop()
  lastAccessibilityScore?: number;

  @Prop()
  lastBestPracticesScore?: number;

  @Prop()
  lastSeoScore?: number;

  @Prop()
  lastScreenshot?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);