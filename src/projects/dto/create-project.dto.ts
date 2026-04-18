import { IsString, IsUrl, IsOptional, IsBoolean, IsIn, IsNotEmpty, ValidateIf } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateIf(o => o.logo !== '' && o.logo !== null && o.logo !== undefined)
  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsOptional()
  @IsIn(['manual', 'daily', 'weekly', 'monthly'])
  autoScanFrequency?: 'manual' | 'daily' | 'weekly' | 'monthly';

  @IsBoolean()
  @IsOptional()
  includeSeo?: boolean;

  @IsBoolean()
  @IsOptional()
  includeAccessibility?: boolean;

  @IsBoolean()
  @IsOptional()
  includeBestPractices?: boolean;

  @IsOptional()
  storageItems?: { key: string; value: string }[];
}
