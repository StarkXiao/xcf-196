import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray, ValidateNested } from 'class-validator';

export class CreateCheckinDto {
  @IsString()
  pactId: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(['happy', 'normal', 'tired', 'excited', 'grateful'])
  @IsOptional()
  mood?: 'happy' | 'normal' | 'tired' | 'excited' | 'grateful';

  @IsEnum(['user', 'partner', 'both'])
  @IsOptional()
  checkedBy?: 'user' | 'partner' | 'both';

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsBoolean()
  @IsOptional()
  isMakeup?: boolean;

  @IsString()
  @IsOptional()
  makeupReason?: string;

  @IsArray()
  @IsOptional()
  subtaskIds?: string[];

  @IsOptional()
  subtaskProgress?: Record<string, number>;
}
