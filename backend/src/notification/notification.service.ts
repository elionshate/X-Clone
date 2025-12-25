import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(dto: CreateNotificationDto) {
    // Don't create notification if actor is the same as recipient
    if (dto.userId === dto.actorId) {
      return null;
    }

    return this.prisma.notification.create({
      data: {
        type: dto.type,
        userId: dto.userId,
        actorId: dto.actorId,
        tweetId: dto.tweetId,
        commentId: dto.commentId,
      },
      include: {
        actor: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });
  }

  async getNotificationsByUserId(userId: number, skip = 0, take = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(notificationId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async deleteNotification(notificationId: number) {
    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Helper to get tweet info for notification display
  async getNotificationWithTweet(notificationId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        actor: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    if (notification?.tweetId) {
      const tweet = await this.prisma.tweet.findUnique({
        where: { id: notification.tweetId },
        select: { id: true, content: true, authorId: true },
      });
      return { ...notification, tweet };
    }

    return notification;
  }

  async getNotificationsWithDetails(userId: number, skip = 0, take = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    // Get tweet details for notifications that have tweetId
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.tweetId) {
          const tweet = await this.prisma.tweet.findUnique({
            where: { id: notification.tweetId },
            select: { id: true, content: true, authorId: true },
          });
          return { ...notification, tweet };
        }
        return notification;
      })
    );

    return notificationsWithDetails;
  }
}
