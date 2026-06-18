import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DatePlansService } from './date-plans.service';
import { CreateDatePlanDto } from './dto/create-date-plan.dto';
import { UpdateDatePlanDto } from './dto/update-date-plan.dto';
import { AddInspirationDto } from './dto/add-inspiration.dto';
import { VoteDto } from './dto/vote.dto';
import { DateCheckinDto } from './dto/date-checkin.dto';
import { DateReviewDto } from './dto/date-review.dto';
import { ConfirmPlanDto } from './dto/confirm-plan.dto';

@Controller('api/date-plans')
export class DatePlansController {
  constructor(private readonly datePlansService: DatePlansService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.datePlansService.findAll(status, category);
  }

  @Get('stats')
  getStats() {
    return this.datePlansService.getStats();
  }

  @Get('upcoming')
  getUpcoming(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.datePlansService.getUpcoming(daysNum);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datePlansService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateDatePlanDto) {
    return this.datePlansService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDatePlanDto) {
    return this.datePlansService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datePlansService.remove(id);
  }

  @Post(':id/inspirations')
  addInspiration(@Param('id') id: string, @Body() dto: AddInspirationDto) {
    return this.datePlansService.addInspiration(id, dto);
  }

  @Delete(':id/inspirations/:inspirationId')
  removeInspiration(
    @Param('id') id: string,
    @Param('inspirationId') inspirationId: string,
  ) {
    return this.datePlansService.removeInspiration(id, inspirationId);
  }

  @Post(':id/start-voting')
  startVoting(@Param('id') id: string) {
    return this.datePlansService.startVoting(id);
  }

  @Post(':id/vote')
  vote(@Param('id') id: string, @Body() dto: VoteDto) {
    return this.datePlansService.vote(id, dto);
  }

  @Delete(':id/vote/:inspirationId/:votedBy')
  removeVote(
    @Param('id') id: string,
    @Param('inspirationId') inspirationId: string,
    @Param('votedBy') votedBy: string,
  ) {
    return this.datePlansService.removeVote(id, inspirationId, votedBy);
  }

  @Post(':id/confirm')
  confirmPlan(@Param('id') id: string, @Body() dto: ConfirmPlanDto) {
    return this.datePlansService.confirmPlan(id, dto);
  }

  @Post(':id/book')
  markBooked(@Param('id') id: string) {
    return this.datePlansService.markBooked(id);
  }

  @Post(':id/checkin')
  checkin(@Param('id') id: string, @Body() dto: DateCheckinDto) {
    return this.datePlansService.checkin(id, dto);
  }

  @Post(':id/review')
  addReview(@Param('id') id: string, @Body() dto: DateReviewDto) {
    return this.datePlansService.addReview(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.datePlansService.cancel(id);
  }
}
