import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsNumber()
  authorId: number;

  @IsNumber()
  tweetId: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}

export class CreateReplyDto {
  @IsString()
  content: string;

  @IsNumber()
  authorId: number;

  @IsNumber()
  tweetId: number;

  @IsNumber()
  parentId: number;
}

export class UpdateCommentLikesDto {
  @IsNumber()
  likeCount: number;
}

export class LikeCommentDto {
  @IsNumber()
  userId: number;
}
