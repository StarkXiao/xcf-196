import { Module, forwardRef } from '@nestjs/common';
import { ReadingPlansService } from './reading-plans.service';
import { ReadingPlansController } from './reading-plans.controller';
import { TimelineModule } from '../timeline/timeline.module';
import { GrowthModule } from '../growth/growth.module';

@Module({
  imports: [forwardRef(() => TimelineModule), forwardRef(() => GrowthModule)],
  controllers: [ReadingPlansController],
  providers: [ReadingPlansService],
  exports: [ReadingPlansService],
})
export class ReadingPlansModule {}
