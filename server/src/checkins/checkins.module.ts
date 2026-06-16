import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { PactsModule } from '../pacts/pacts.module';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [PactsModule, TimelineModule, RemindersModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
