import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { MoodsService } from './moods.service';
import { CreateMoodDto } from './dto/create-mood.dto';
import { CompleteComfortTaskDto } from './dto/complete-comfort-task.dto';
import { MoodLevel } from './entities/mood-record.entity';

@Controller('api/moods')
export class MoodsController {
  constructor(private readonly moodsService: MoodsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.moodsService.getDashboard();
  }

  @Get('today')
  getTodayMood() {
    return this.moodsService.getTodayMood();
  }

  @Get('stats')
  getStats(
    @Query('period') period?: string,
    @Query('periods') periods?: string,
  ) {
    const p = period || 'week';
    const n = periods ? parseInt(periods, 10) : 1;
    return this.moodsService.getStats(p, n);
  }

  @Get('trend')
  getTrend(
    @Query('period') period?: string,
    @Query('periods') periods?: string,
  ) {
    const p = (period as 'day' | 'week' | 'month') || 'week';
    const n = periods ? parseInt(periods, 10) : 4;
    return this.moodsService.getTrendStats(p, n);
  }

  @Get('anomaly-alerts')
  getAnomalyAlerts() {
    return this.moodsService.getAnomalyAlerts();
  }

  @Get('comfort-tasks/recommend')
  recommendComfortTasks(@Query('targetMood') targetMood?: MoodLevel) {
    return this.moodsService.recommendComfortTasks(targetMood);
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

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('reportedBy') reportedBy?: string,
  ) {
    return this.moodsService.findAll(startDate, endDate, reportedBy);
  }

  @Post()
  create(@Body() createMoodDto: CreateMoodDto) {
    return this.moodsService.create(createMoodDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moodsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moodsService.remove(id);
  }
}
