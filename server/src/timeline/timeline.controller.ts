import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller('api/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  findAll(@Query('type') type?: string, @Query('limit') limit?: string) {
    return this.timelineService.findAll(type, limit ? parseInt(limit, 10) : undefined);
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
