import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  partnerName?: string;

  @IsString()
  @IsOptional()
  partnerAvatar?: string;

  @IsString()
  @IsOptional()
  anniversary?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsEnum(['moonlight', 'sunset', 'ocean', 'forest'])
  @IsOptional()
  theme?: 'moonlight' | 'sunset' | 'ocean' | 'forest';

  @IsObject()
  @IsOptional()
  notifications?: {
    dailyReminder?: boolean;
    pactReminder?: boolean;
    checkinReminder?: boolean;
  };
}
