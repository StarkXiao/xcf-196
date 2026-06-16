import { Controller, Get, Query } from '@nestjs/common';
import { MonthlyReviewService } from './monthly-review.service';

@Controller('api/monthly-review')
export class MonthlyReviewController {
  constructor(private readonly monthlyReviewService: MonthlyReviewService) {}

  @Get()
  getMonthlyReview(
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    return this.monthlyReviewService.getMonthlyReview(year, month);
  }
}
