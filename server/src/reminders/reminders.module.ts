import { Module, forwardRef } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { PactsModule } from '../pacts/pacts.module';
import { UsersModule } from '../users/users.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { ReadingPlansModule } from '../reading-plans/reading-plans.module';

@Module({
  imports: [forwardRef(() => PactsModule), forwardRef(() => UsersModule), forwardRef(() => WishlistModule), forwardRef(() => ReadingPlansModule)],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
