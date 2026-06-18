import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FamilyTasksService } from './family-tasks.service';
import { CreateFamilyTaskDto } from './dto/create-family-task.dto';
import { UpdateFamilyTaskDto } from './dto/update-family-task.dto';
import { CompleteFamilyTaskDto, VerifyFamilyTaskDto, AssignFamilyTaskDto } from './dto/family-task-action.dto';

@Controller('api/family-tasks')
export class FamilyTasksController {
  constructor(private readonly familyTasksService: FamilyTasksService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.familyTasksService.findAll(status, category, assignedTo);
  }

  @Get('stats')
  getStats() {
    return this.familyTasksService.getStats();
  }

  @Get('review')
  getReview(@Query('period') period?: string) {
    const p = (period === 'month' ? 'month' : 'week') as 'week' | 'month';
    return this.familyTasksService.getReview(p);
  }

  @Get('upcoming-reminders')
  getUpcomingReminders(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.familyTasksService.getUpcomingReminders(daysNum);
  }

  @Get('categories')
  getCategories() {
    return this.familyTasksService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyTasksService.findOne(id);
  }

  @Post()
  create(@Body() createFamilyTaskDto: CreateFamilyTaskDto) {
    return this.familyTasksService.create(createFamilyTaskDto);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() assignDto: AssignFamilyTaskDto) {
    return this.familyTasksService.assign(id, assignDto);
  }

  @Post(':id/start')
  startProgress(@Param('id') id: string) {
    return this.familyTasksService.startProgress(id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() completeDto: CompleteFamilyTaskDto) {
    return this.familyTasksService.complete(id, completeDto);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string, @Body() verifyDto: VerifyFamilyTaskDto) {
    return this.familyTasksService.verify(id, verifyDto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.familyTasksService.cancel(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFamilyTaskDto: UpdateFamilyTaskDto) {
    return this.familyTasksService.update(id, updateFamilyTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.familyTasksService.remove(id);
  }
}
