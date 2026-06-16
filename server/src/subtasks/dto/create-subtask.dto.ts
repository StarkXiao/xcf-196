import { IsString, IsOptional, IsInt, Min, IsBoolean, IsDateString } from 'class-validator';

export class CreateSubtaskDto {
  @IsString()
  pactId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsInt()
  @Min(1)
  targetCount: number;

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
