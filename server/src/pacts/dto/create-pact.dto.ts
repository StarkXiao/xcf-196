import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';

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
}
