import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray, ValidateNested, IsObject } from 'class-validator';

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  isMakeup?: boolean;

  @IsString()
  @IsOptional()
  makeupReason?: string;

  @IsArray()
  @IsOptional()
  subtaskIds?: string[];

  @IsObject()
  @IsOptional()
  subtaskProgress?: Record<string, number>;
}
