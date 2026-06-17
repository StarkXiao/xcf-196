import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsBoolean, IsNumber, Max } from 'class-validator';

export class CreateWishDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['travel', 'food', 'experience', 'growth', 'romance', 'other'])
  category: 'travel' | 'food' | 'experience' | 'growth' | 'romance' | 'other';

  @IsEnum(['user', 'partner'])
  @IsOptional()
  createdBy?: 'user' | 'partner';

  @IsInt()
  @Min(1)
  @IsOptional()
  targetProgress?: number;

  @IsString()
  @IsOptional()
  progressUnit?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  reminderDaysBefore?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
