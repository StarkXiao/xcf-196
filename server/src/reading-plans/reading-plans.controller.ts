import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ReadingPlansService } from './reading-plans.service';
import {
  CreateReadingPlanDto,
  UpdateReadingPlanDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateReadingCheckinDto,
  CreateReadingThoughtDto,
  CreateThoughtReplyDto,
  MarkChapterReadDto,
  LikeThoughtDto,
} from './dto/create-reading-plan.dto';

@Controller('api/reading-plans')
export class ReadingPlansController {
  constructor(private readonly readingPlansService: ReadingPlansService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('category') category?: string) {
    return this.readingPlansService.findAll(status, category);
  }

  @Get('stats')
  getStats() {
    return this.readingPlansService.getStats();
  }

  @Get('upcoming-reminders')
  getUpcomingReminders(@Query('days') days?: string) {
    return this.readingPlansService.getUpcomingReminders(days ? parseInt(days, 10) : 7);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readingPlansService.findOne(id);
  }

  @Get(':id/full')
  getFullDetails(@Param('id') id: string) {
    return this.readingPlansService.getFullDetails(id);
  }

  @Post()
  create(@Body() data: CreateReadingPlanDto) {
    return this.readingPlansService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateReadingPlanDto) {
    return this.readingPlansService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.readingPlansService.remove(id);
  }

  @Get(':id/chapters')
  getChapters(@Param('id') id: string) {
    return this.readingPlansService.getChapters(id);
  }

  @Get(':id/chapters/:chapterId')
  getChapter(@Param('id') id: string, @Param('chapterId') chapterId: string) {
    return this.readingPlansService.getChapter(id, chapterId);
  }

  @Post('chapters')
  createChapter(@Body() data: CreateChapterDto) {
    return this.readingPlansService.createChapter(data);
  }

  @Patch(':id/chapters/:chapterId')
  updateChapter(
    @Param('id') id: string,
    @Param('chapterId') chapterId: string,
    @Body() data: UpdateChapterDto,
  ) {
    return this.readingPlansService.updateChapter(id, chapterId, data);
  }

  @Post('chapters/mark-read')
  markChapterRead(@Body() data: MarkChapterReadDto) {
    return this.readingPlansService.markChapterRead(data);
  }

  @Get(':id/checkins')
  getCheckins(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.readingPlansService.getCheckins(id, startDate, endDate);
  }

  @Post('checkins')
  createCheckin(@Body() data: CreateReadingCheckinDto) {
    return this.readingPlansService.createCheckin(data);
  }

  @Get(':id/thoughts')
  getThoughts(
    @Param('id') id: string,
    @Query('chapterId') chapterId?: string,
  ) {
    return this.readingPlansService.getThoughts(id, chapterId);
  }

  @Post('thoughts')
  createThought(@Body() data: CreateReadingThoughtDto) {
    return this.readingPlansService.createThought(data);
  }

  @Post('thoughts/replies')
  createThoughtReply(@Body() data: CreateThoughtReplyDto) {
    return this.readingPlansService.createThoughtReply(data);
  }

  @Post('thoughts/:id/like')
  likeThought(@Param('id') id: string, @Body() data: LikeThoughtDto) {
    return this.readingPlansService.likeThought(id, data.likedBy);
  }

  @Get(':id/milestones')
  getMilestones(
    @Param('id') id: string,
    @Query('achieved') achieved?: string,
  ) {
    return this.readingPlansService.getMilestones(
      id,
      achieved === undefined ? undefined : achieved === 'true',
    );
  }

  @Post('milestones/:id/achieve')
  achieveMilestone(
    @Param('id') id: string,
    @Body('achievedBy') achievedBy: 'user' | 'partner' | 'both',
  ) {
    return this.readingPlansService.achieveMilestone(id, achievedBy);
  }
}
