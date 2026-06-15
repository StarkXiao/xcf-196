import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Controller('api/checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Get()
  findAll(
    @Query('pactId') pactId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.checkinsService.findAll(pactId, startDate, endDate);
  }

  @Get('stats')
  getStats(@Query('pactId') pactId?: string) {
    return this.checkinsService.getCheckinStats(pactId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkinsService.findOne(id);
  }

  @Post()
  create(@Body() createCheckinDto: CreateCheckinDto) {
    return this.checkinsService.create(createCheckinDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checkinsService.remove(id);
  }
}
