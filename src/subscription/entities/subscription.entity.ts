import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true })
  plan: 'free' | 'pro' | 'agency';

  @Prop({ default: 'active' })
  status: 'active' | 'expired' | 'cancelled';

  @Prop()
  startedAt?: Date;

  @Prop()
  expiredAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);