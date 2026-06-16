import { Module } from '@nestjs/common';
import { PactsModule } from './pacts/pacts.module';
import { CheckinsModule } from './checkins/checkins.module';
import { TimelineModule } from './timeline/timeline.module';
import { RemindersModule } from './reminders/reminders.module';
import { UsersModule } from './users/users.module';
import { CountdownModule } from './countdown/countdown.module';
import { SubtasksModule } from './subtasks/subtasks.module';
import { GrowthModule } from './growth/growth.module';
import { MonthlyReviewModule } from './monthly-review/monthly-review.module';

@Module({
  imports: [
    PactsModule,
    CheckinsModule,
    TimelineModule,
    RemindersModule,
    UsersModule,
    CountdownModule,
    SubtasksModule,
    GrowthModule,
    MonthlyReviewModule,
  ],
})
export class AppModule {}
