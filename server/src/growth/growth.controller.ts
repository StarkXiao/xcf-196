import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { GrowthService } from './growth.service';
import { GrowthRecord } from './entities/growth.entity';

@Controller('api/growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get('stats')
  getStats() {
    return this.growthService.getStats();
  }

  @Get('records')
  findAll(@Query('limit') limit?: string, @Query('sourceType') sourceType?: string) {
    return this.growthService.findAll(
      limit ? parseInt(limit, 10) : undefined,
      sourceType,
    );
  }

  @Get('records/:id')
  findOne(@Param('id') id: string) {
    return this.growthService.findOne(id);
  }

  @Get('badges')
  getBadges() {
    return this.growthService.getBadges();
  }

  @Get('levels')
  getLevels() {
    return [
      { level: 1, name: '初识', icon: '🌱', minPoints: 0, maxPoints: 99, color: '#a8e6cf' },
      { level: 2, name: '相知', icon: '🌿', minPoints: 100, maxPoints: 299, color: '#88d8b0' },
      { level: 3, name: '相恋', icon: '🌸', minPoints: 300, maxPoints: 599, color: '#ff6b6b' },
      { level: 4, name: '相守', icon: '🌳', minPoints: 600, maxPoints: 999, color: '#4ecdc4' },
      { level: 5, name: '永恒', icon: '💫', minPoints: 1000, maxPoints: 1999, color: '#f9ca24' },
      { level: 6, name: '传奇', icon: '👑', minPoints: 2000, maxPoints: 999999, color: '#e056fd' },
    ];
  }

  @Post('records')
  addRecord(@Body() data: Partial<GrowthRecord> & { points: number; reason: string; sourceType: GrowthRecord['sourceType'] }) {
    return this.growthService.addRecord(
      data.points,
      data.reason,
      data.sourceType,
      data.sourceId,
      data.metadata,
    );
  }
}
