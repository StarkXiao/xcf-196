import { Module, forwardRef } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';
import { CountdownModule } from '../countdown/countdown.module';

@Module({
  imports: [
    forwardRef(() => TimelineModule),
    forwardRef(() => RemindersModule),
    forwardRef(() => CountdownModule),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
