import { Module, forwardRef } from '@nestjs/common';
import { SubtasksService } from './subtasks.service';
import { SubtasksController } from './subtasks.controller';
import { PactsModule } from '../pacts/pacts.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [forwardRef(() => PactsModule), TimelineModule],
  controllers: [SubtasksController],
  providers: [SubtasksService],
  exports: [SubtasksService],
})
export class SubtasksModule {}
