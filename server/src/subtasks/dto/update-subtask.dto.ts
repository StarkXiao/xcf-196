import { IsString, IsOptional, IsInt, Min, IsBoolean, IsDateString, IsEnum } from 'class-validator';

export class UpdateSubtaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsEnum(['pending', 'in_progress', 'completed'])
  @IsOptional()
  status?: 'pending' | 'in_progress' | 'completed';

  @IsInt()
  @Min(1)
  @IsOptional()
  targetCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  currentCount?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsBoolean()
  @IsOptional()
  isMilestone?: boolean;

  @IsString()
  @IsOptional()
  milestoneReward?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
