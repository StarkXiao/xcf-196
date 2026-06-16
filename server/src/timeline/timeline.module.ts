import { Module, forwardRef } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { UsersModule } from '../users/users.module';
import { PactsModule } from '../pacts/pacts.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => PactsModule),
  ],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}
