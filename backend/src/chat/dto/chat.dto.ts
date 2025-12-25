import { IsString, IsNumber, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateChatDto {
  @IsArray()
  @IsNumber({}, { each: true })
  memberIds: number[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;
}

export class CreateMessageDto {
  @IsNumber()
  chatId: number;

  @IsNumber()
  senderId: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];
}

export class MessageMediaDto {
  @IsString()
  mediaUrl: string;

  @IsString()
  mediaType: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

export class AddMemberDto {
  @IsNumber()
  chatId: number;

  @IsNumber()
  userId: number;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
