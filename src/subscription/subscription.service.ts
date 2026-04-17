import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from './entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async getSubscription(userId: string): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async createInitial(userId: string): Promise<SubscriptionDocument> {
    const existing = await this.subscriptionModel.findOne({ 
      userId: new Types.ObjectId(userId) 
    });
    
    if (existing) return existing;

    const newSubscription = new this.subscriptionModel({
      userId: new Types.ObjectId(userId),
      plan: 'free',
      status: 'active',
      startDate: new Date(),
    });

    return newSubscription.save();
  }
}
