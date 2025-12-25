import { IsNumber } from 'class-validator';

export class CreateBookmarkDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  tweetId: number;
}
