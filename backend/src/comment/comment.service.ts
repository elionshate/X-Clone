import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentDto, UpdateCommentLikesDto } from './dto/comment.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createComment(createCommentDto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        authorId: createCommentDto.authorId,
        tweetId: createCommentDto.tweetId,
      },
      include: {
        author: true,
        tweet: {
          include: { author: true },
        },
      },
    });

    // Create notification for the tweet owner
    if (comment.tweet.authorId !== createCommentDto.authorId) {
      await this.notificationService.createNotification({
        type: 'comment',
        userId: comment.tweet.authorId,
        actorId: createCommentDto.authorId,
        tweetId: createCommentDto.tweetId,
        commentId: comment.id,
      });
    }

    return comment;
  }

  async getCommentById(id: number) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        tweet: true,
      },
    });
  }

  async getCommentsByTweetId(tweetId: number, skip = 0, take = 20) {
    return this.prisma.comment.findMany({
      where: { tweetId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
      },
    });
  }

  async getCommentsByUserId(userId: number, skip = 0, take = 10) {
    return this.prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
        tweet: true,
      },
    });
  }

  async updateComment(id: number, content: string) {
    return this.prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: true,
        tweet: true,
      },
    });
  }

  async deleteComment(id: number) {
    return this.prisma.comment.delete({
      where: { id },
    });
  }

  async updateCommentLikes(id: number, updateDto: UpdateCommentLikesDto) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        likeCount: updateDto.likeCount,
      },
      include: {
        author: true,
        tweet: true,
      },
    });
  }

  async incrementCommentLikes(id: number) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementCommentLikes(id: number) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });
  }

  async getCommentCount(tweetId: number) {
    return this.prisma.comment.count({
      where: { tweetId },
    });
  }
}
