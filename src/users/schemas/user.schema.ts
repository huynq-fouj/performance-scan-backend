import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  fullName: string;

  @Prop()
  avatar?: string;

  // Role
  @Prop({ default: 'user' })
  role: 'user' | 'admin';

  // Subscription
  @Prop({ default: 'free' })
  plan: 'free' | 'pro' | 'agency';

  // Usage
  @Prop({ default: 0 })
  monthlyScanUsed: number;

  @Prop()
  monthlyResetAt?: Date;

  // Account Status
  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
