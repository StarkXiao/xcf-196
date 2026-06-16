import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdatePactDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['daily', 'weekly', 'monthly', 'special'])
  @IsOptional()
  category?: 'daily' | 'weekly' | 'monthly' | 'special';

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsEnum(['pending_confirmation', 'active', 'completed', 'paused'])
  @IsOptional()
  status?: 'pending_confirmation' | 'active' | 'completed' | 'paused';

  @IsInt()
  @Min(0)
  @IsOptional()
  currentStreak?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  longestStreak?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  totalCheckins?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  totalMakeupCheckins?: number;

  @IsBoolean()
  @IsOptional()
  allowMakeup?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxMakeupDays?: number;

  @IsBoolean()
  @IsOptional()
  requireMakeupReason?: boolean;

  @IsBoolean()
  @IsOptional()
  requireDualConfirmation?: boolean;

  @IsBoolean()
  @IsOptional()
  creatorConfirmed?: boolean;

  @IsBoolean()
  @IsOptional()
  partnerConfirmed?: boolean;

  @IsDateString()
  @IsOptional()
  confirmedAt?: string;
}
