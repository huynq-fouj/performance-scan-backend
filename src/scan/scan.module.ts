import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { Scan, ScanSchema } from './entities/scan.entity';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Scan.name, schema: ScanSchema }]),
    ProjectsModule,
  ],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}

