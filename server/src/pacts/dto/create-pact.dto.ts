import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsBoolean } from 'class-validator';

export class CreatePactDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['daily', 'weekly', 'monthly', 'special'])
  category: 'daily' | 'weekly' | 'monthly' | 'special';

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

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
}
