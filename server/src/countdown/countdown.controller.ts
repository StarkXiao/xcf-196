import { Controller, Get, Query } from '@nestjs/common';
import { CountdownService } from './countdown.service';

@Controller('api/countdown')
export class CountdownController {
  constructor(private readonly countdownService: CountdownService) {}

  @Get()
  findAll() {
    return this.countdownService.findAll();
  }

  @Get('atmosphere')
  getAtmosphere() {
    return this.countdownService.getAtmosphere();
  }

  @Get('upcoming')
  getUpcoming(@Query('days') days?: string) {
    return this.countdownService.getUpcomingReminders(days ? parseInt(days, 10) : 7);
  }
}
