import { Module, forwardRef } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { TimelineModule } from '../timeline/timeline.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [
    forwardRef(() => TimelineModule),
    forwardRef(() => RemindersModule),
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
