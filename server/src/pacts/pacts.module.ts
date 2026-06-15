import { Module } from '@nestjs/common';
import { PactsService } from './pacts.service';
import { PactsController } from './pacts.controller';

@Module({
  controllers: [PactsController],
  providers: [PactsService],
  exports: [PactsService],
})
export class PactsModule {}
