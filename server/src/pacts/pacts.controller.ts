import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PactsService } from './pacts.service';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pactsService.findOne(id);
  }

  @Post()
  create(@Body() createPactDto: CreatePactDto) {
    return this.pactsService.create(createPactDto);
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
