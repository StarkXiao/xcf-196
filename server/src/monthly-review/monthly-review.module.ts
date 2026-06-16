import { Module, forwardRef } from '@nestjs/common';
import { MonthlyReviewService } from './monthly-review.service';
import { MonthlyReviewController } from './monthly-review.controller';
import { PactsModule } from '../pacts/pacts.module';
import { CheckinsModule } from '../checkins/checkins.module';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';
import { GrowthModule } from '../growth/growth.module';

@Module({
  imports: [
    forwardRef(() => PactsModule),
    forwardRef(() => CheckinsModule),
    forwardRef(() => TimelineModule),
    forwardRef(() => RemindersModule),
    forwardRef(() => GrowthModule),
  ],
  controllers: [MonthlyReviewController],
  providers: [MonthlyReviewService],
})
export class MonthlyReviewModule {}
