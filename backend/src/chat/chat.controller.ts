import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto, CreateMessageDto, AddMemberDto } from './dto/chat.dto';

@Controller('chats')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  async createChat(@Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(createChatDto);
  }

  @Get(':id')
  async getChatById(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.getChatById(id);
  }

  @Get('user/:userId')
  async getChatsByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.chatService.getChatsByUserId(userId);
  }

  @Post('messages')
  async sendMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.chatService.sendMessage(createMessageDto);
  }

  @Get(':chatId/messages')
  async getMessagesByChatId(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '50',
  ) {
    return this.chatService.getMessagesByChatId(chatId, parseInt(skip), parseInt(take));
  }

  @Post('members')
  async addMember(@Body() addMemberDto: AddMemberDto) {
    return this.chatService.addMember(addMemberDto);
  }

  @Delete(':chatId/members/:userId')
  async removeMember(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.removeMember(chatId, userId);
  }

  @Patch(':id/name')
  async updateChatName(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
  ) {
    return this.chatService.updateChatName(id, name);
  }

  @Delete(':id')
  async deleteChat(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.deleteChat(id);
  }

  @Post('direct/:userId1/:userId2')
  async findOrCreateDirectChat(
    @Param('userId1', ParseIntPipe) userId1: number,
    @Param('userId2', ParseIntPipe) userId2: number,
  ) {
    return this.chatService.findOrCreateDirectChat(userId1, userId2);
  }
}
