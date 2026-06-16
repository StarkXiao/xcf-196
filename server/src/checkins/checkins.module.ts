import { Module, forwardRef } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { PactsModule } from '../pacts/pacts.module';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';
import { SubtasksModule } from '../subtasks/subtasks.module';

@Module({
  imports: [PactsModule, TimelineModule, RemindersModule, forwardRef(() => SubtasksModule)],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
