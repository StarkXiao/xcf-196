import { Module, forwardRef } from '@nestjs/common';
import { GrowthService } from './growth.service';
import { GrowthController } from './growth.controller';
import { CheckinsModule } from '../checkins/checkins.module';
import { PactsModule } from '../pacts/pacts.module';
import { UsersModule } from '../users/users.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [
    forwardRef(() => CheckinsModule),
    forwardRef(() => PactsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => TimelineModule),
  ],
  controllers: [GrowthController],
  providers: [GrowthService],
  exports: [GrowthService],
})
export class GrowthModule {}
