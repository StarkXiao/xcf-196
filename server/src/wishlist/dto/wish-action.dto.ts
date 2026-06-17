import { IsEnum, IsOptional, IsString, IsInt, Min, IsNumber, Max } from 'class-validator';

export class ClaimWishDto {
  @IsEnum(['user', 'partner'])
  claimedBy: 'user' | 'partner';
}

export class ProgressWishDto {
  @IsInt()
  @Min(1)
  amount: number;
}

export class CompleteWishDto {
  @IsString()
  @IsOptional()
  completedReview?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  completedRating?: number;
}
