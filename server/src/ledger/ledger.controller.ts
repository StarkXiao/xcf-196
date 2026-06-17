import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateLedgerRecordDto } from './dto/create-ledger-record.dto';
import { UpdateLedgerRecordDto } from './dto/update-ledger-record.dto';
import type { LedgerRecord, SpecialDayBudget, LedgerSettlement, LedgerMonthSummary, LedgerStats, LedgerDashboardData } from './entities/ledger-record.entity';

@Controller('api/ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('paidBy') paidBy?: string,
    @Query('isSpecialDay') isSpecialDay?: string,
  ): LedgerRecord[] {
    return this.ledgerService.findAll(
      startDate,
      endDate,
      category,
      type,
      paidBy,
      isSpecialDay ? isSpecialDay === 'true' : undefined,
    );
  }

  @Get('stats')
  getStats(): LedgerStats {
    return this.ledgerService.getStats();
  }

  @Get('dashboard')
  getDashboard(): LedgerDashboardData {
    return this.ledgerService.getDashboardData();
  }

  @Get('categories')
  getCategories() {
    return this.ledgerService.getCategories();
  }

  @Get('month-summary')
  getMonthSummary(
    @Query('year') year: string,
    @Query('month') month: string,
  ): LedgerMonthSummary {
    return this.ledgerService.getMonthSummary(parseInt(year), parseInt(month));
  }

  @Get('special-day-budgets')
  getSpecialDayBudgets(@Query('active') active?: string): SpecialDayBudget[] {
    return this.ledgerService.getSpecialDayBudgets(active === 'true');
  }

  @Post('special-day-budgets')
  createSpecialDayBudget(@Body() dto: {
    title: string;
    description?: string;
    budget: number;
    date: string;
    type: SpecialDayBudget['type'];
    linkedAnniversaryId?: string;
    color?: string;
    icon?: string;
  }): SpecialDayBudget {
    return this.ledgerService.createSpecialDayBudget(dto);
  }

  @Patch('special-day-budgets/:id')
  updateSpecialDayBudget(
    @Param('id') id: string,
    @Body() dto: Partial<SpecialDayBudget>,
  ): SpecialDayBudget {
    return this.ledgerService.updateSpecialDayBudget(id, dto);
  }

  @Delete('special-day-budgets/:id')
  deleteSpecialDayBudget(@Param('id') id: string): void {
    this.ledgerService.deleteSpecialDayBudget(id);
  }

  @Get('settlements')
  getSettlements(@Query('status') status?: string): LedgerSettlement[] {
    return this.ledgerService.getSettlements(status);
  }

  @Post('settlements/:year/:month')
  createSettlement(
    @Param('year') year: string,
    @Param('month') month: string,
  ): LedgerSettlement {
    return this.ledgerService.createMonthlySettlement(parseInt(year), parseInt(month));
  }

  @Post('settlements/:id/settle')
  settle(
    @Param('id') id: string,
    @Body() dto: { settledBy: 'user' | 'partner'; note?: string },
  ): LedgerSettlement {
    return this.ledgerService.settle(id, dto.settledBy, dto.note);
  }

  @Get(':id')
  findOne(@Param('id') id: string): LedgerRecord {
    return this.ledgerService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLedgerRecordDto): LedgerRecord {
    return this.ledgerService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLedgerRecordDto,
  ): LedgerRecord {
    return this.ledgerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): void {
    this.ledgerService.remove(id);
  }
}
