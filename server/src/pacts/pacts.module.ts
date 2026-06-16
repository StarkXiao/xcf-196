import { Module, forwardRef } from '@nestjs/common';
import { PactsService } from './pacts.service';
import { PactsController } from './pacts.controller';
import { GrowthModule } from '../growth/growth.module';

@Module({
  imports: [forwardRef(() => GrowthModule)],
  controllers: [PactsController],
  providers: [PactsService],
  exports: [PactsService],
})
export class PactsModule {}
