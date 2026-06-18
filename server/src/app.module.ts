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
import { WishlistModule } from './wishlist/wishlist.module';
import { TravelPlansModule } from './travel-plans/travel-plans.module';
import { GiftPlansModule } from './gift-plans/gift-plans.module';
import { MoodsModule } from './moods/moods.module';
import { LedgerModule } from './ledger/ledger.module';
import { ReadingPlansModule } from './reading-plans/reading-plans.module';
import { DatePlansModule } from './date-plans/date-plans.module';

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
    WishlistModule,
    TravelPlansModule,
    GiftPlansModule,
    MoodsModule,
    LedgerModule,
    ReadingPlansModule,
    DatePlansModule,
  ],
})
export class AppModule {}
