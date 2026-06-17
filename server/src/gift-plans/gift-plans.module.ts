import { Module, forwardRef } from '@nestjs/common';
import { GiftPlansService } from './gift-plans.service';
import { GiftPlansController } from './gift-plans.controller';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [forwardRef(() => TimelineModule), forwardRef(() => RemindersModule)],
  controllers: [GiftPlansController],
  providers: [GiftPlansService],
  exports: [GiftPlansService],
})
export class GiftPlansModule {}
