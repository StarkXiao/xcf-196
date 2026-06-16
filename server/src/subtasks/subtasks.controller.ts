import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@Controller('api/subtasks')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Get()
  findAll(@Query('pactId') pactId?: string, @Query('status') status?: string) {
    return this.subtasksService.findAll(pactId, status);
  }

  @Get('stats/:pactId')
  getStats(@Param('pactId') pactId: string) {
    return this.subtasksService.getStats(pactId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subtasksService.findOne(id);
  }

  @Post()
  create(@Body() createSubtaskDto: CreateSubtaskDto) {
    return this.subtasksService.create(createSubtaskDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubtaskDto: UpdateSubtaskDto) {
    return this.subtasksService.update(id, updateSubtaskDto);
  }

  @Post(':id/increment')
  incrementProgress(@Param('id') id: string, @Body() body: { amount?: number }) {
    return this.subtasksService.incrementProgress(id, body.amount);
  }

  @Post(':id/decrement')
  decrementProgress(@Param('id') id: string, @Body() body: { amount?: number }) {
    return this.subtasksService.decrementProgress(id, body.amount);
  }

  @Post('reorder/:pactId')
  reorder(@Param('pactId') pactId: string, @Body() body: { subtaskIds: string[] }) {
    return this.subtasksService.reorder(pactId, body.subtaskIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subtasksService.remove(id);
  }
}
