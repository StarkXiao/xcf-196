import { Module } from '@nestjs/common';
import { FamilyTasksService } from './family-tasks.service';
import { FamilyTasksController } from './family-tasks.controller';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [TimelineModule, RemindersModule],
  controllers: [FamilyTasksController],
  providers: [FamilyTasksService],
  exports: [FamilyTasksService],
})
export class FamilyTasksModule {}
