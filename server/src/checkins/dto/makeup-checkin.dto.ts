import { IsString, IsOptional, IsEnum, IsDateString, IsNotEmpty, IsArray } from 'class-validator';

export class MakeupCheckinDto {
  @IsString()
  pactId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

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

  @IsString()
  @IsOptional()
  makeupReason?: string;
}
