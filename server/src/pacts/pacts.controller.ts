import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PactsService, PausePactDto, ResumePactDto } from './pacts.service';
import { CreatePactDto } from './dto/create-pact.dto';
import { UpdatePactDto } from './dto/update-pact.dto';

@Controller('api/pacts')
export class PactsController {
  constructor(private readonly pactsService: PactsService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('category') category?: string) {
    return this.pactsService.findAll(status, category);
  }

  @Get('stats')
  getStats() {
    return this.pactsService.getStats();
  }

  @Get('upcoming-resumes')
  getUpcomingResumes(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.pactsService.getUpcomingResumes(daysNum);
  }

  @Get('paused-with-resume')
  getPausedWithResumePlan() {
    return this.pactsService.getPausedWithResumePlan();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pactsService.findOne(id);
  }

  @Post()
  create(@Body() createPactDto: CreatePactDto) {
    return this.pactsService.create(createPactDto);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: { role: 'creator' | 'partner' }) {
    return this.pactsService.confirm(id, body.role);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @Body() pauseDto: PausePactDto) {
    return this.pactsService.pause(id, pauseDto);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string, @Body() resumeDto?: ResumePactDto) {
    return this.pactsService.resume(id, resumeDto);
  }

  @Post(':id/resume-plan')
  setResumePlan(
    @Param('id') id: string,
    @Body() body: { resumeDate: string; resumeReminderEnabled?: boolean; resumeReminderDays?: number },
  ) {
    return this.pactsService.setResumePlan(
      id,
      body.resumeDate,
      body.resumeReminderEnabled,
      body.resumeReminderDays,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePactDto: UpdatePactDto) {
    return this.pactsService.update(id, updatePactDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pactsService.remove(id);
  }
}
