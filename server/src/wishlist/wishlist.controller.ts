import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { ClaimWishDto, ProgressWishDto, CompleteWishDto } from './dto/wish-action.dto';

@Controller('api/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('category') category?: string) {
    return this.wishlistService.findAll(status, category);
  }

  @Get('stats')
  getStats() {
    return this.wishlistService.getStats();
  }

  @Get('upcoming-reminders')
  getUpcomingReminders(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.wishlistService.getUpcomingReminders(daysNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishlistService.findOne(id);
  }

  @Post()
  create(@Body() createWishDto: CreateWishDto) {
    return this.wishlistService.create(createWishDto);
  }

  @Post(':id/claim')
  claim(@Param('id') id: string, @Body() claimDto: ClaimWishDto) {
    return this.wishlistService.claim(id, claimDto.claimedBy);
  }

  @Post(':id/progress')
  progress(@Param('id') id: string, @Body() progressDto: ProgressWishDto) {
    return this.wishlistService.progress(id, progressDto.amount);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() completeDto: CompleteWishDto) {
    return this.wishlistService.complete(id, completeDto.completedReview, completeDto.completedRating);
  }

  @Post(':id/abandon')
  abandon(@Param('id') id: string) {
    return this.wishlistService.abandon(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWishDto: UpdateWishDto) {
    return this.wishlistService.update(id, updateWishDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wishlistService.remove(id);
  }
}
