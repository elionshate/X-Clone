import { IsString, IsNumber, IsArray, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreateTweetDto {
  @IsString()
  content: string;

  @IsNumber()
  authorId: number;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdateTweetDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  @IsArray()
  mediaIdsToRemove?: number[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;
}

export class UpdateTweetLikesDto {
  @IsNumber()
  likeCount: number;
}

export class UpdateRetweetsDto {
  @IsNumber()
  retweetCount: number;
}
