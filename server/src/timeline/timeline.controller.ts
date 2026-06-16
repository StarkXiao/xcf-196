import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller('api/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  findAll(@Query('type') type?: string, @Query('limit') limit?: string) {
    return this.timelineService.findAll(type, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('upcoming-events')
  getUpcomingEvents() {
    const anniversaryEvents = this.timelineService.generateUpcomingAnniversaryEvents();
    const pactEvents = this.timelineService.generateUpcomingSpecialPactEvents();
    return [...anniversaryEvents, ...pactEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timelineService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.timelineService.create(data);
  }
}
