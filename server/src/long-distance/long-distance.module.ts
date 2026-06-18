import { Module } from '@nestjs/common';
import { LongDistanceService } from './long-distance.service';
import { LongDistanceController } from './long-distance.controller';

@Module({
  controllers: [LongDistanceController],
  providers: [LongDistanceService],
  exports: [LongDistanceService],
})
export class LongDistanceModule {}
