import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CompleteComfortTaskDto {
  @IsEnum(['user', 'partner', 'both'])
  @IsOptional()
  completedBy?: 'user' | 'partner' | 'both';

  @IsString()
  @IsOptional()
  completedNote?: string;
}
