import { Module, forwardRef } from '@nestjs/common';
import { CountdownService } from './countdown.service';
import { CountdownController } from './countdown.controller';
import { PactsModule } from '../pacts/pacts.module';
import { UsersModule } from '../users/users.module';
import { RemindersModule } from '../reminders/reminders.module';
import { GiftPlansModule } from '../gift-plans/gift-plans.module';

@Module({
  imports: [
    forwardRef(() => PactsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => RemindersModule),
    forwardRef(() => GiftPlansModule),
  ],
  controllers: [CountdownController],
  providers: [CountdownService],
  exports: [CountdownService],
})
export class CountdownModule {}
