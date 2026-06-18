import { Module, forwardRef } from '@nestjs/common';
import { DatePlansService } from './date-plans.service';
import { DatePlansController } from './date-plans.controller';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [forwardRef(() => TimelineModule), forwardRef(() => RemindersModule)],
  controllers: [DatePlansController],
  providers: [DatePlansService],
  exports: [DatePlansService],
})
export class DatePlansModule {}
