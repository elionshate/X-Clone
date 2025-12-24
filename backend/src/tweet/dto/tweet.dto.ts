import { IsString, IsNumber, IsArray, IsOptional, IsUrl } from 'class-validator';

export class CreateTweetDto {
  @IsString()
  content: string;

  @IsNumber()
  authorId: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  mediaUrls?: string[];
}

export class UpdateTweetLikesDto {
  @IsNumber()
  likeCount: number;
}

export class UpdateRetweetsDto {
  @IsNumber()
  retweetCount: number;
}
