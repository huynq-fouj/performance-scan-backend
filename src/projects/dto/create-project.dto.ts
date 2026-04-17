import { IsString, IsUrl, IsOptional, IsBoolean, IsIn, IsNotEmpty } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsOptional()
  @IsIn(['manual', 'daily', 'weekly', 'monthly'])
  autoScanFrequency?: 'manual' | 'daily' | 'weekly' | 'monthly';
}
