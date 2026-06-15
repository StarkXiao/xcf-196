import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';

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

  @IsEnum(['active', 'completed', 'paused'])
  @IsOptional()
  status?: 'active' | 'completed' | 'paused';

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
}
