import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { Scan, ScanSchema } from './entities/scan.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ScanProcessor } from './scan.processor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Scan.name, schema: ScanSchema }]),
    BullModule.registerQueue({
      name: 'lighthouse-scan',
    }),
    ProjectsModule,
  ],
  controllers: [ScanController],
  providers: [ScanService, ScanProcessor],
})
export class ScanModule {}
