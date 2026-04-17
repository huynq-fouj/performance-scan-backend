import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  fullName: string;

  @Expose()
  avatar?: string;

  @Expose()
  role: string;

  @Expose()
  plan: string;

  @Expose()
  isActive: boolean;

  @Expose()
  lastLoginAt?: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
