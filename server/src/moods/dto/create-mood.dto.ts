import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, IsDateString } from 'class-validator';

export type MoodLevel = 'very_bad' | 'bad' | 'neutral' | 'good' | 'excellent';

export class CreateMoodDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsEnum(['very_bad', 'bad', 'neutral', 'good', 'excellent'])
  mood: MoodLevel;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  moodScore?: number;

  @IsEnum(['user', 'partner'])
  @IsOptional()
  reportedBy?: 'user' | 'partner';

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  triggers?: string[];
}
