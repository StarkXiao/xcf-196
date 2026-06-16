import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller('api/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    const active = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.remindersService.findAll(active);
  }

  @Get('upcoming-anniversary')
  getUpcomingAnniversary(@Query('days') days?: string) {
    return this.remindersService.getUpcomingAnniversaryReminders(
      days ? parseInt(days, 10) : 7,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.remindersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.remindersService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.remindersService.update(id, body);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.remindersService.toggle(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.remindersService.remove(id);
  }
}
