import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateChatDto, CreateMessageDto, AddMemberDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChat(createChatDto: CreateChatDto) {
    const isGroup = createChatDto.isGroup ?? createChatDto.memberIds.length > 2;
    
    const chat = await this.prisma.chat.create({
      data: {
        name: createChatDto.name,
        isGroup,
        members: {
          create: createChatDto.memberIds.map((userId, index) => ({
            userId,
            isAdmin: index === 0, // First member is admin
          })),
        },
      },
      include: {
        members: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return chat;
  }

  async getChatById(chatId: number) {
    return this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: true },
        },
      },
    });
  }

  async getChatsByUserId(userId: number) {
    const memberships = await this.prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: { user: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: true },
            },
          },
        },
      },
    });

    return memberships.map(m => ({
      ...m.chat,
      lastMessage: m.chat.messages[0] || null,
    }));
  }

  async sendMessage(createMessageDto: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        chatId: createMessageDto.chatId,
        senderId: createMessageDto.senderId,
        content: createMessageDto.content,
      },
      include: {
        sender: true,
        chat: true,
        media: true,
      },
    });

    // Add media if provided
    if (createMessageDto.mediaUrls && createMessageDto.mediaUrls.length > 0) {
      for (const mediaUrl of createMessageDto.mediaUrls) {
        const isImage = mediaUrl.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaUrl);
        await this.prisma.messageMedia.create({
          data: {
            messageId: message.id,
            mediaUrl,
            mediaType: isImage ? 'image' : 'file',
          },
        });
      }
      // Return the message with media
      return this.prisma.message.findUnique({
        where: { id: message.id },
        include: {
          sender: true,
          chat: true,
          media: true,
        },
      });
    }

    // Update chat's updatedAt
    await this.prisma.chat.update({
      where: { id: createMessageDto.chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getMessagesByChatId(chatId: number, skip = 0, take = 50) {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
      include: { 
        sender: true,
        media: true,
      },
    });
  }

  async addMember(addMemberDto: AddMemberDto) {
    return this.prisma.chatMember.create({
      data: {
        chatId: addMemberDto.chatId,
        userId: addMemberDto.userId,
        isAdmin: addMemberDto.isAdmin ?? false,
      },
      include: { user: true },
    });
  }

  async removeMember(chatId: number, userId: number) {
    return this.prisma.chatMember.deleteMany({
      where: { chatId, userId },
    });
  }

  async updateChatName(chatId: number, name: string) {
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { name },
      include: {
        members: {
          include: { user: true },
        },
      },
    });
  }

  async deleteChat(chatId: number) {
    return this.prisma.chat.delete({
      where: { id: chatId },
    });
  }

  async findOrCreateDirectChat(userId1: number, userId2: number) {
    // Find existing direct chat between these two users
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: userId1 } } },
          { members: { some: { userId: userId2 } } },
        ],
      },
      include: {
        members: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new direct chat
    return this.createChat({
      memberIds: [userId1, userId2],
      isGroup: false,
    });
  }
}
