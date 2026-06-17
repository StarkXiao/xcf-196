import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TravelPlansService } from './travel-plans.service';
import {
  CreateTravelPlanDto,
  UpdateTravelPlanDto,
  CreateItineraryDto,
  UpdateItineraryDto,
  CreateBudgetDto,
  UpdateBudgetDto,
  CreateCheckinDto,
  CreateMemoryDto,
  UpdateMemoryDto,
  CreateReminderDto,
  UpdateReminderDto,
  CompletePlanDto,
} from './dto/travel-plan.dto';

@Controller('api/travel-plans')
export class TravelPlansController {
  constructor(private readonly travelPlansService: TravelPlansService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.travelPlansService.findAll(status);
  }

  @Get('stats')
  getStats() {
    return this.travelPlansService.getStats();
  }

  @Get('upcoming')
  getUpcomingPlans(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.travelPlansService.getUpcomingPlans(daysNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelPlansService.findOne(id);
  }

  @Get(':id/full')
  getPlanFullDetails(@Param('id') id: string) {
    return this.travelPlansService.getPlanFullDetails(id);
  }

  @Post()
  create(@Body() dto: CreateTravelPlanDto) {
    return this.travelPlansService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTravelPlanDto) {
    return this.travelPlansService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.travelPlansService.remove(id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompletePlanDto) {
    return this.travelPlansService.complete(id, dto);
  }

  @Get(':id/itineraries')
  getItineraries(@Param('id') planId: string) {
    return this.travelPlansService.getItineraries(planId);
  }

  @Post('itineraries')
  createItinerary(@Body() dto: CreateItineraryDto) {
    return this.travelPlansService.createItinerary(dto);
  }

  @Patch('itineraries/:id')
  updateItinerary(@Param('id') id: string, @Body() dto: UpdateItineraryDto) {
    return this.travelPlansService.updateItinerary(id, dto);
  }

  @Delete('itineraries/:id')
  removeItinerary(@Param('id') id: string) {
    return this.travelPlansService.removeItinerary(id);
  }

  @Get(':id/budgets')
  getBudgets(@Param('id') planId: string) {
    return this.travelPlansService.getBudgets(planId);
  }

  @Get(':id/budget-stats')
  getBudgetStats(@Param('id') planId: string) {
    return this.travelPlansService.getBudgetStats(planId);
  }

  @Post('budgets')
  createBudget(@Body() dto: CreateBudgetDto) {
    return this.travelPlansService.createBudget(dto);
  }

  @Patch('budgets/:id')
  updateBudget(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.travelPlansService.updateBudget(id, dto);
  }

  @Delete('budgets/:id')
  removeBudget(@Param('id') id: string) {
    return this.travelPlansService.removeBudget(id);
  }

  @Get(':id/checkins')
  getCheckins(@Param('id') planId: string) {
    return this.travelPlansService.getCheckins(planId);
  }

  @Post('checkins')
  createCheckin(@Body() dto: CreateCheckinDto) {
    return this.travelPlansService.createCheckin(dto);
  }

  @Delete('checkins/:id')
  removeCheckin(@Param('id') id: string) {
    return this.travelPlansService.removeCheckin(id);
  }

  @Get(':id/memories')
  getMemories(@Param('id') planId: string) {
    return this.travelPlansService.getMemories(planId);
  }

  @Post('memories')
  createMemory(@Body() dto: CreateMemoryDto) {
    return this.travelPlansService.createMemory(dto);
  }

  @Patch('memories/:id')
  updateMemory(@Param('id') id: string, @Body() dto: UpdateMemoryDto) {
    return this.travelPlansService.updateMemory(id, dto);
  }

  @Delete('memories/:id')
  removeMemory(@Param('id') id: string) {
    return this.travelPlansService.removeMemory(id);
  }

  @Post('memories/:id/toggle-favorite')
  toggleMemoryFavorite(@Param('id') id: string) {
    return this.travelPlansService.toggleMemoryFavorite(id);
  }

  @Get(':id/reminders')
  getReminders(@Param('id') planId: string) {
    return this.travelPlansService.getReminders(planId);
  }

  @Post('reminders')
  createReminder(@Body() dto: CreateReminderDto) {
    return this.travelPlansService.createReminder(dto);
  }

  @Patch('reminders/:id')
  updateReminder(@Param('id') id: string, @Body() dto: UpdateReminderDto) {
    return this.travelPlansService.updateReminder(id, dto);
  }

  @Delete('reminders/:id')
  removeReminder(@Param('id') id: string) {
    return this.travelPlansService.removeReminder(id);
  }

  @Post('reminders/:id/toggle')
  toggleReminder(@Param('id') id: string) {
    return this.travelPlansService.toggleReminder(id);
  }
}
