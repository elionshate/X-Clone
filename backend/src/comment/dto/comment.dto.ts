import { IsString, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsNumber()
  authorId: number;

  @IsNumber()
  tweetId: number;
}

export class UpdateCommentLikesDto {
  @IsNumber()
  likeCount: number;
}
