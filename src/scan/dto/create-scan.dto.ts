import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateScanDto {
  @IsMongoId()
  @IsNotEmpty()
  projectId: string;
}
