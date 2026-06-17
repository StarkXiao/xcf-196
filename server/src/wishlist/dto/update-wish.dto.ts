import { IsString, IsOptional, IsEnum, IsInt, Min, IsBoolean, IsDateString } from 'class-validator';

export class UpdateWishDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['travel', 'food', 'experience', 'growth', 'romance', 'other'])
  @IsOptional()
  category?: 'travel' | 'food' | 'experience' | 'growth' | 'romance' | 'other';

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
