import { Module, forwardRef } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { PactsModule } from '../pacts/pacts.module';

@Module({
  imports: [forwardRef(() => PactsModule)],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
