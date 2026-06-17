import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateLedgerRecordDto } from './dto/create-ledger-record.dto';
import { UpdateLedgerRecordDto } from './dto/update-ledger-record.dto';
import type { LedgerRecord, SpecialDayBudget, LedgerSettlement, LedgerCategory, LedgerMonthSummary, LedgerStats, LedgerDashboardData } from './entities/ledger-record.entity';
import { ledgerCategories } from './entities/ledger-record.entity';
import { mockLedgerRecords, mockSpecialDayBudgets, mockSettlements } from '../data/seed';
import { TimelineService } from '../timeline/timeline.service';
import { RemindersService } from '../reminders/reminders.service';
import { CountdownService } from '../countdown/countdown.service';

@Injectable()
export class LedgerService {
  private records: LedgerRecord[] = [...mockLedgerRecords];
  private specialDayBudgets: SpecialDayBudget[] = [...mockSpecialDayBudgets];
  private settlements: LedgerSettlement[] = [...mockSettlements];

  constructor(
    @Inject(forwardRef(() => TimelineService))
    private readonly timelineService: TimelineService,
    @Inject(forwardRef(() => RemindersService))
    private readonly remindersService: RemindersService,
    @Inject(forwardRef(() => CountdownService))
    private readonly countdownService: CountdownService,
  ) {}

  private getCategoryInfo(category: LedgerCategory) {
    return ledgerCategories.find(c => c.category === category) || ledgerCategories[ledgerCategories.length - 1];
  }

  private calculateShares(record: Partial<LedgerRecord>): { userShare: number; partnerShare: number } {
    if (record.paidBy === 'user') {
      return { userShare: record.amount || 0, partnerShare: 0 };
    }
    if (record.paidBy === 'partner') {
      return { userShare: 0, partnerShare: record.amount || 0 };
    }
    const ratio = record.splitRatio || 0.5;
    const userShare = (record.amount || 0) * ratio;
    const partnerShare = (record.amount || 0) * (1 - ratio);
    return { userShare, partnerShare };
  }

  findAll(
    startDate?: string,
    endDate?: string,
    category?: string,
    type?: string,
    paidBy?: string,
    isSpecialDay?: boolean,
  ): LedgerRecord[] {
    let result = [...this.records];
    
    if (startDate) {
      result = result.filter(r => r.date >= startDate);
    }
    if (endDate) {
      result = result.filter(r => r.date <= endDate);
    }
    if (category) {
      result = result.filter(r => r.category === category);
    }
    if (type) {
      result = result.filter(r => r.type === type);
    }
    if (paidBy) {
      result = result.filter(r => r.paidBy === paidBy);
    }
    if (isSpecialDay !== undefined) {
      result = result.filter(r => r.isSpecialDay === isSpecialDay);
    }
    
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  findOne(id: string): LedgerRecord {
    const record = this.records.find(r => r.id === id);
    if (!record) {
      throw new NotFoundException(`账本记录 #${id} 不存在`);
    }
    return record;
  }

  create(dto: CreateLedgerRecordDto): LedgerRecord {
    const now = new Date().toISOString();
    const shares = this.calculateShares(dto);
    
    const newRecord: LedgerRecord = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      amount: dto.amount,
      type: dto.type,
      category: dto.category,
      date: dto.date,
      paidBy: dto.paidBy,
      splitRatio: dto.splitRatio,
      userShare: shares.userShare,
      partnerShare: shares.partnerShare,
      tags: dto.tags || [],
      linkedAnniversaryId: dto.linkedAnniversaryId,
      linkedAnniversaryTitle: dto.linkedAnniversaryTitle,
      isSpecialDay: dto.isSpecialDay || false,
      receiptPhoto: dto.receiptPhoto,
      createdAt: now,
      updatedAt: now,
    };
    
    this.records.push(newRecord);
    this.updateSpecialDayBudgetUsed(newRecord);

    try {
      const categoryInfo = this.getCategoryInfo(newRecord.category);
      this.timelineService.create({
        type: 'ledger_expense',
        title: `${newRecord.type === 'expense' ? '支出' : '收入'}：${newRecord.title}`,
        description: `金额 ¥${newRecord.amount.toFixed(2)}，${newRecord.paidBy === 'user' ? '我' : newRecord.paidBy === 'partner' ? 'TA' : 'AA'}支付`,
        icon: categoryInfo.icon,
        date: newRecord.date,
        metadata: {
          amount: newRecord.amount,
          category: newRecord.category,
          type: newRecord.type,
          paidBy: newRecord.paidBy,
          color: categoryInfo.color,
        },
      });
    } catch (e) {
      // ignore
    }

    return newRecord;
  }

  update(id: string, dto: UpdateLedgerRecordDto): LedgerRecord {
    const record = this.findOne(id);
    const index = this.records.findIndex(r => r.id === id);
    
    const updatedRecord: LedgerRecord = {
      ...record,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
    
    if (dto.amount !== undefined || dto.paidBy !== undefined || dto.splitRatio !== undefined) {
      const shares = this.calculateShares(updatedRecord);
      updatedRecord.userShare = shares.userShare;
      updatedRecord.partnerShare = shares.partnerShare;
    }
    
    this.records[index] = updatedRecord;
    return updatedRecord;
  }

  remove(id: string): void {
    const record = this.findOne(id);
    this.records = this.records.filter(r => r.id !== id);
  }

  getStats(): LedgerStats {
    const records = this.records;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthRecords = records.filter(r => {
      const date = new Date(r.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });
    
    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const currentMonthIncome = currentMonthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const currentMonthExpense = currentMonthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const averageDailyExpense = currentMonthExpense / daysInMonth;
    
    const userTotalPaid = records.filter(r => r.paidBy === 'user').reduce((sum, r) => sum + r.amount, 0);
    const partnerTotalPaid = records.filter(r => r.paidBy === 'partner').reduce((sum, r) => sum + r.amount, 0);
    
    const categoryExpenses = ledgerCategories.map(cat => {
      const catRecords = records.filter(r => r.category === cat.category && r.type === 'expense');
      return {
        ...cat,
        amount: catRecords.reduce((sum, r) => sum + r.amount, 0),
        count: catRecords.length,
      };
    });
    
    const topCategory = categoryExpenses
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)[0];
    
    return {
      totalRecords: records.length,
      totalIncome,
      totalExpense,
      currentMonthExpense,
      currentMonthIncome,
      averageDailyExpense,
      topCategory: topCategory ? {
        category: topCategory.category,
        label: topCategory.label,
        amount: topCategory.amount,
        percentage: totalExpense > 0 ? (topCategory.amount / totalExpense) * 100 : 0,
      } : null,
      userTotalPaid,
      partnerTotalPaid,
    };
  }

  getMonthSummary(year: number, month: number): LedgerMonthSummary {
    const monthRecords = this.records.filter(r => {
      const date = new Date(r.date);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });
    
    const totalIncome = monthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = monthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const balance = totalIncome - totalExpense;
    
    const userTotalPaid = monthRecords.filter(r => r.paidBy === 'user').reduce((sum, r) => sum + r.amount, 0);
    const partnerTotalPaid = monthRecords.filter(r => r.paidBy === 'partner').reduce((sum, r) => sum + r.amount, 0);
    
    const userShareTotal = monthRecords.reduce((sum, r) => sum + (r.userShare || 0), 0);
    const partnerShareTotal = monthRecords.reduce((sum, r) => sum + (r.partnerShare || 0), 0);
    
    const userSettlement = userTotalPaid - userShareTotal;
    const partnerSettlement = partnerTotalPaid - partnerShareTotal;
    const settlementNeeded = Math.abs(userSettlement) > 0.01;
    
    const byCategory = ledgerCategories.map(cat => {
      const catRecords = monthRecords.filter(r => r.category === cat.category && r.type === 'expense');
      const amount = catRecords.reduce((sum, r) => sum + r.amount, 0);
      return {
        category: cat.category,
        label: cat.label,
        amount,
        count: catRecords.length,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        icon: cat.icon,
        color: cat.color,
      };
    }).sort((a, b) => b.amount - a.amount);
    
    return {
      year,
      month,
      totalIncome,
      totalExpense,
      balance,
      userTotalPaid,
      partnerTotalPaid,
      userShareTotal,
      partnerShareTotal,
      userSettlement,
      partnerSettlement,
      settlementNeeded,
      byCategory,
      recordCount: monthRecords.length,
    };
  }

  getSpecialDayBudgets(activeOnly?: boolean): SpecialDayBudget[] {
    let result = [...this.specialDayBudgets];
    if (activeOnly) {
      result = result.filter(b => b.isActive);
    }
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getSpecialDayBudget(id: string): SpecialDayBudget {
    const budget = this.specialDayBudgets.find(b => b.id === id);
    if (!budget) {
      throw new NotFoundException(`特殊日预算 #${id} 不存在`);
    }
    return budget;
  }

  createSpecialDayBudget(dto: {
    title: string;
    description?: string;
    budget: number;
    date: string;
    type: SpecialDayBudget['type'];
    linkedAnniversaryId?: string;
    color?: string;
    icon?: string;
  }): SpecialDayBudget {
    const now = new Date().toISOString();
    const newBudget: SpecialDayBudget = {
      id: uuidv4(),
      title: dto.title,
      description: dto.description || '',
      budget: dto.budget,
      usedAmount: 0,
      remaining: dto.budget,
      date: dto.date,
      type: dto.type,
      linkedAnniversaryId: dto.linkedAnniversaryId,
      isActive: true,
      color: dto.color || '#ff4081',
      icon: dto.icon || '💕',
      createdAt: now,
    };
    this.specialDayBudgets.push(newBudget);
    return newBudget;
  }

  updateSpecialDayBudget(id: string, dto: Partial<SpecialDayBudget>): SpecialDayBudget {
    const budget = this.getSpecialDayBudget(id);
    const index = this.specialDayBudgets.findIndex(b => b.id === id);
    const updated = {
      ...budget,
      ...dto,
      remaining: dto.budget !== undefined ? dto.budget - budget.usedAmount : budget.remaining,
    };
    this.specialDayBudgets[index] = updated;
    return updated;
  }

  deleteSpecialDayBudget(id: string): void {
    this.getSpecialDayBudget(id);
    this.specialDayBudgets = this.specialDayBudgets.filter(b => b.id !== id);
  }

  private updateSpecialDayBudgetUsed(record: LedgerRecord): void {
    if (!record.isSpecialDay || record.type !== 'expense') return;
    
    let budget: SpecialDayBudget | undefined;
    
    if (record.linkedAnniversaryId) {
      budget = this.specialDayBudgets.find(b => 
        b.isActive && b.linkedAnniversaryId === record.linkedAnniversaryId
      );
    }
    
    if (!budget) {
      const today = record.date;
      budget = this.specialDayBudgets.find(b => 
        b.isActive && b.date === today
      );
    }
    
    if (budget) {
      const index = this.specialDayBudgets.findIndex(b => b.id === budget.id);
      const newUsed = budget.usedAmount + record.amount;
      const remaining = budget.budget - newUsed;
      this.specialDayBudgets[index] = {
        ...budget,
        usedAmount: newUsed,
        remaining,
      };
      
      if (remaining < 0 && budget.remaining >= 0) {
        try {
          this.remindersService.create({
            title: `⚠️ ${budget.title}预算超支`,
            description: `「${budget.title}」预算已超支 ¥${Math.abs(remaining).toFixed(2)}，当前已花费 ¥${newUsed.toFixed(2)}，预算 ¥${budget.budget.toFixed(2)}`,
            type: 'custom',
            date: new Date().toISOString().split('T')[0],
            time: '20:00',
            repeat: 'none',
            isActive: true,
            priority: 'high',
          } as any);
        } catch (e) {
          // ignore
        }
      } else if (remaining < budget.budget * 0.3 && budget.remaining >= budget.budget * 0.3) {
        try {
          this.remindersService.create({
            title: `📊 ${budget.title}预算即将用完`,
            description: `「${budget.title}」预算已使用 70%，剩余 ¥${remaining.toFixed(2)}，请合理安排消费`,
            type: 'custom',
            date: new Date().toISOString().split('T')[0],
            time: '20:00',
            repeat: 'none',
            isActive: true,
            priority: 'medium',
          } as any);
        } catch (e) {
          // ignore
        }
      }
    }
  }

  getSettlements(status?: string): LedgerSettlement[] {
    let result = [...this.settlements];
    if (status) {
      result = result.filter(s => s.status === status);
    }
    return result.sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));
  }

  getSettlement(id: string): LedgerSettlement {
    const settlement = this.settlements.find(s => s.id === id);
    if (!settlement) {
      throw new NotFoundException(`结算记录 #${id} 不存在`);
    }
    return settlement;
  }

  createMonthlySettlement(year: number, month: number): LedgerSettlement {
    const existing = this.settlements.find(s => s.year === year && s.month === month);
    if (existing) {
      return existing;
    }
    
    const summary = this.getMonthSummary(year, month);
    const newSettlement: LedgerSettlement = {
      id: uuidv4(),
      year,
      month,
      userPaid: summary.userTotalPaid,
      partnerPaid: summary.partnerTotalPaid,
      userShare: summary.userShareTotal,
      partnerShare: summary.partnerShareTotal,
      userOwes: summary.partnerSettlement > 0 ? summary.partnerSettlement : 0,
      partnerOwes: summary.userSettlement > 0 ? summary.userSettlement : 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    this.settlements.push(newSettlement);
    
    try {
      const owesAmount = Math.max(newSettlement.userOwes, newSettlement.partnerOwes);
      const owesText = newSettlement.userOwes > 0 
        ? `我需要付给TA ¥${owesAmount.toFixed(2)}`
        : newSettlement.partnerOwes > 0
          ? `TA需要付给我 ¥${owesAmount.toFixed(2)}`
          : '本月两清，无需转账';
      
      this.remindersService.create({
        title: `📊 ${year}年${month}月账单待结算`,
        description: `本月总支出 ¥${summary.totalExpense.toFixed(2)}，总收入 ¥${summary.totalIncome.toFixed(2)}。${owesText}，请及时结算。`,
        type: 'custom',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        repeat: 'none',
        isActive: true,
        priority: 'high',
      } as any);
    } catch (e) {
      // ignore
    }
    
    return newSettlement;
  }

  settle(id: string, settledBy: 'user' | 'partner', note?: string): LedgerSettlement {
    const settlement = this.getSettlement(id);
    const index = this.settlements.findIndex(s => s.id === id);
    
    const updated: LedgerSettlement = {
      ...settlement,
      status: 'settled',
      settledBy,
      settledAt: new Date().toISOString(),
      note,
    };
    
    this.settlements[index] = updated;
    
    try {
      const owesAmount = Math.max(settlement.userOwes, settlement.partnerOwes);
      const settledText = settlement.userOwes > 0 
        ? `${settledBy === 'user' ? '我' : 'TA'}已支付 ¥${owesAmount.toFixed(2)} 给对方`
        : settlement.partnerOwes > 0
          ? `${settledBy === 'user' ? '我' : 'TA'}已收到 ¥${owesAmount.toFixed(2)} 转账`
          : '本月两清，无需转账';
      
      this.remindersService.create({
        title: `✅ ${settlement.year}年${settlement.month}月账单已结清`,
        description: `${settledText}，${note ? '备注：' + note : ''}`,
        type: 'custom',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        repeat: 'none',
        isActive: true,
        priority: 'medium',
      } as any);
    } catch (e) {
      // ignore
    }
    
    return updated;
  }

  getDashboardData(): LedgerDashboardData {
    const now = new Date();
    const stats = this.getStats();
    const currentMonthSummary = this.getMonthSummary(now.getFullYear(), now.getMonth() + 1);
    const recentRecords = this.records
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    const specialDayBudgets = this.getSpecialDayBudgets(true);
    
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    this.createMonthlySettlement(lastMonth.getFullYear(), lastMonth.getMonth() + 1);
    
    const pendingSettlement = this.settlements
      .filter(s => s.status === 'pending')
      .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month))[0] || null;
    
    return {
      stats,
      currentMonthSummary,
      recentRecords,
      specialDayBudgets,
      pendingSettlement,
    };
  }

  getCategories() {
    return ledgerCategories;
  }
}
