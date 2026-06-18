import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LongDistanceService } from './long-distance.service';
import { CreateCallAppointmentDto, UpdateCallAppointmentDto } from './dto/call-appointment.dto';
import { CreateMeetingCountdownDto, UpdateMeetingCountdownDto } from './dto/meeting-countdown.dto';
import { CreateMissingRecordDto, UpdateMissingRecordDto, MissingReplyDto } from './dto/missing-record.dto';
import { CreateGiftReminderDto, UpdateGiftReminderDto } from './dto/gift-reminder.dto';
import { CreateMeetingReviewDto, UpdateMeetingReviewDto } from './dto/meeting-review.dto';

@Controller('api/long-distance')
export class LongDistanceController {
  constructor(private readonly longDistanceService: LongDistanceService) {}

  @Get('stats')
  getStats() {
    return this.longDistanceService.getStats();
  }

  @Get('upcoming')
  getUpcoming(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.longDistanceService.getUpcoming(daysNum);
  }

  @Get('call-appointments')
  findAllCallAppointments(@Query('status') status?: string) {
    return this.longDistanceService.findAllCallAppointments(status);
  }

  @Get('call-appointments/:id')
  findOneCallAppointment(@Param('id') id: string) {
    return this.longDistanceService.findOneCallAppointment(id);
  }

  @Post('call-appointments')
  createCallAppointment(@Body() dto: CreateCallAppointmentDto) {
    return this.longDistanceService.createCallAppointment(dto);
  }

  @Patch('call-appointments/:id')
  updateCallAppointment(@Param('id') id: string, @Body() dto: UpdateCallAppointmentDto) {
    return this.longDistanceService.updateCallAppointment(id, dto);
  }

  @Delete('call-appointments/:id')
  removeCallAppointment(@Param('id') id: string) {
    return this.longDistanceService.removeCallAppointment(id);
  }

  @Get('meeting-countdowns')
  findAllMeetingCountdowns(@Query('status') status?: string) {
    return this.longDistanceService.findAllMeetingCountdowns(status);
  }

  @Get('meeting-countdowns/:id')
  findOneMeetingCountdown(@Param('id') id: string) {
    return this.longDistanceService.findOneMeetingCountdown(id);
  }

  @Post('meeting-countdowns')
  createMeetingCountdown(@Body() dto: CreateMeetingCountdownDto) {
    return this.longDistanceService.createMeetingCountdown(dto);
  }

  @Patch('meeting-countdowns/:id')
  updateMeetingCountdown(@Param('id') id: string, @Body() dto: UpdateMeetingCountdownDto) {
    return this.longDistanceService.updateMeetingCountdown(id, dto);
  }

  @Delete('meeting-countdowns/:id')
  removeMeetingCountdown(@Param('id') id: string) {
    return this.longDistanceService.removeMeetingCountdown(id);
  }

  @Get('missing-records')
  findAllMissingRecords(
    @Query('category') category?: string,
    @Query('createdBy') createdBy?: string,
  ) {
    return this.longDistanceService.findAllMissingRecords(category, createdBy);
  }

  @Get('missing-records/:id')
  findOneMissingRecord(@Param('id') id: string) {
    return this.longDistanceService.findOneMissingRecord(id);
  }

  @Post('missing-records')
  createMissingRecord(@Body() dto: CreateMissingRecordDto) {
    return this.longDistanceService.createMissingRecord(dto);
  }

  @Patch('missing-records/:id')
  updateMissingRecord(@Param('id') id: string, @Body() dto: UpdateMissingRecordDto) {
    return this.longDistanceService.updateMissingRecord(id, dto);
  }

  @Delete('missing-records/:id')
  removeMissingRecord(@Param('id') id: string) {
    return this.longDistanceService.removeMissingRecord(id);
  }

  @Post('missing-records/:id/like')
  likeMissingRecord(
    @Param('id') id: string,
    @Body('likedBy') likedBy: 'user' | 'partner',
  ) {
    return this.longDistanceService.likeMissingRecord(id, likedBy);
  }

  @Post('missing-records/:id/reply')
  addMissingReply(@Param('id') id: string, @Body() dto: MissingReplyDto) {
    return this.longDistanceService.addMissingReply(id, dto);
  }

  @Get('gift-reminders')
  findAllGiftReminders(
    @Query('status') status?: string,
    @Query('giftType') giftType?: string,
  ) {
    return this.longDistanceService.findAllGiftReminders(status, giftType);
  }

  @Get('gift-reminders/:id')
  findOneGiftReminder(@Param('id') id: string) {
    return this.longDistanceService.findOneGiftReminder(id);
  }

  @Post('gift-reminders')
  createGiftReminder(@Body() dto: CreateGiftReminderDto) {
    return this.longDistanceService.createGiftReminder(dto);
  }

  @Patch('gift-reminders/:id')
  updateGiftReminder(@Param('id') id: string, @Body() dto: UpdateGiftReminderDto) {
    return this.longDistanceService.updateGiftReminder(id, dto);
  }

  @Delete('gift-reminders/:id')
  removeGiftReminder(@Param('id') id: string) {
    return this.longDistanceService.removeGiftReminder(id);
  }

  @Get('meeting-reviews')
  findAllMeetingReviews() {
    return this.longDistanceService.findAllMeetingReviews();
  }

  @Get('meeting-reviews/:id')
  findOneMeetingReview(@Param('id') id: string) {
    return this.longDistanceService.findOneMeetingReview(id);
  }

  @Post('meeting-reviews')
  createMeetingReview(@Body() dto: CreateMeetingReviewDto) {
    return this.longDistanceService.createMeetingReview(dto);
  }

  @Patch('meeting-reviews/:id')
  updateMeetingReview(@Param('id') id: string, @Body() dto: UpdateMeetingReviewDto) {
    return this.longDistanceService.updateMeetingReview(id, dto);
  }

  @Delete('meeting-reviews/:id')
  removeMeetingReview(@Param('id') id: string) {
    return this.longDistanceService.removeMeetingReview(id);
  }
}
