import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { MakeupCheckinDto } from './dto/makeup-checkin.dto';

@Controller('api/checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Get()
  findAll(
    @Query('pactId') pactId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
    @Query('checkedBy') checkedBy?: string,
  ) {
    return this.checkinsService.findAll(pactId, startDate, endDate);
  }

  @Get('stats')
  getStats(@Query('pactId') pactId?: string) {
    return this.checkinsService.getCheckinStats(pactId);
  }

  @Get('trend')
  getTrendStats(
    @Query('period') period?: string,
    @Query('periods') periods?: string,
    @Query('pactId') pactId?: string,
    @Query('category') category?: string,
    @Query('checkedBy') checkedBy?: string,
  ) {
    const periodUnit = (period as 'day' | 'week' | 'month') || 'week';
    const periodsNum = periods ? parseInt(periods, 10) : 8;
    const checkedByFilter = checkedBy as 'user' | 'partner' | 'both' | undefined;
    return this.checkinsService.getTrendStats(periodUnit, periodsNum, pactId, category, checkedByFilter);
  }

  @Get('missed')
  getAllMissedCheckins() {
    return this.checkinsService.getAllMissedCheckins();
  }

  @Get('missed/:pactId')
  getMissedCheckins(@Param('pactId') pactId: string) {
    return this.checkinsService.getMissedCheckins(pactId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkinsService.findOne(id);
  }

  @Post()
  create(@Body() createCheckinDto: CreateCheckinDto) {
    return this.checkinsService.create(createCheckinDto);
  }

  @Post('makeup')
  makeup(@Body() makeupCheckinDto: MakeupCheckinDto) {
    return this.checkinsService.makeupCheckin(makeupCheckinDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checkinsService.remove(id);
  }
}
