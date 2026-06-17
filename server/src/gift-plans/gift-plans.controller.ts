import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GiftPlansService } from './gift-plans.service';
import { CreateGiftPlanDto } from './dto/create-gift-plan.dto';
import { UpdateGiftPlanDto } from './dto/update-gift-plan.dto';
import { UpdateStatusDto, AddGiftItemDto, UpdateGiftItemDto, CompleteGiftDto } from './dto/gift-plan-action.dto';

@Controller('api/gift-plans')
export class GiftPlansController {
  constructor(private readonly giftPlansService: GiftPlansService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('recipient') recipient?: string,
  ) {
    return this.giftPlansService.findAll(status, category, recipient);
  }

  @Get('stats')
  getStats() {
    return this.giftPlansService.getStats();
  }

  @Get('upcoming')
  getUpcoming(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.giftPlansService.getUpcoming(daysNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.giftPlansService.findOne(id);
  }

  @Post()
  create(@Body() createGiftPlanDto: CreateGiftPlanDto) {
    return this.giftPlansService.create(createGiftPlanDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGiftPlanDto: UpdateGiftPlanDto) {
    return this.giftPlansService.update(id, updateGiftPlanDto);
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.giftPlansService.updateStatus(id, updateStatusDto.status);
  }

  @Post(':id/items')
  addGiftItem(@Param('id') id: string, @Body() addGiftItemDto: AddGiftItemDto) {
    return this.giftPlansService.addGiftItem(id, addGiftItemDto);
  }

  @Patch(':id/items/:itemId')
  updateGiftItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateGiftItemDto: UpdateGiftItemDto,
  ) {
    return this.giftPlansService.updateGiftItem(id, itemId, updateGiftItemDto);
  }

  @Delete(':id/items/:itemId')
  removeGiftItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.giftPlansService.removeGiftItem(id, itemId);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() completeGiftDto: CompleteGiftDto) {
    return this.giftPlansService.complete(id, completeGiftDto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.giftPlansService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.giftPlansService.remove(id);
  }
}
