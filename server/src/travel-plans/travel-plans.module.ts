import { Module, forwardRef } from '@nestjs/common';
import { TravelPlansService } from './travel-plans.service';
import { TravelPlansController } from './travel-plans.controller';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [
    forwardRef(() => TimelineModule),
    forwardRef(() => RemindersModule),
  ],
  controllers: [TravelPlansController],
  providers: [TravelPlansService],
  exports: [TravelPlansService],
})
export class TravelPlansModule {}
