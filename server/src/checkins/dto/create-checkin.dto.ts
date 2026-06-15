import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

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
}
