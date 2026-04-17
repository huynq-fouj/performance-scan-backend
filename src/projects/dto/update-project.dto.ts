import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
