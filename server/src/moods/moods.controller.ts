import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { MoodsService } from './moods.service';
import { CreateMoodDto } from './dto/create-mood.dto';
import { CompleteComfortTaskDto } from './dto/complete-comfort-task.dto';

@Controller('api/moods')
export class MoodsController {
  constructor(private readonly moodsService: MoodsService) {}

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('reportedBy') reportedBy?: string,
  ) {
    return this.moodsService.findAll(startDate, endDate, reportedBy);
  }

  @Get('stats')
  getStats() {
    return this.moodsService.getStats();
  }

  @Get('today')
  getTodayMood(@Query('reportedBy') reportedBy?: string) {
    return this.moodsService.getTodayMood(reportedBy);
  }

  @Get('anomalies')
  getAnomalyAlerts() {
    return this.moodsService.getAnomalyAlerts();
  }

  @Get('trend')
  getTrendStats(
    @Query('period') period?: string,
    @Query('periods') periods?: string,
  ) {
    const periodUnit = (period as 'day' | 'week' | 'month') || 'week';
    const periodsNum = periods ? parseInt(periods, 10) : 4;
    return this.moodsService.getTrendStats(periodUnit, periodsNum);
  }

  @Get('comfort-tasks')
  getComfortTasks(@Query('includeCompleted') includeCompleted?: string) {
    return this.moodsService.getComfortTasks(includeCompleted === 'true');
  }

  @Post('comfort-tasks/:id/complete')
  completeComfortTask(
    @Param('id') taskId: string,
    @Body() dto: CompleteComfortTaskDto,
  ) {
    return this.moodsService.completeComfortTask(taskId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moodsService.findOne(id);
  }

  @Post()
  create(@Body() createMoodDto: CreateMoodDto) {
    return this.moodsService.create(createMoodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moodsService.remove(id);
  }
}
