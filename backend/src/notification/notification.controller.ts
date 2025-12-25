import { Controller, Get, Post, Param, Query, Body, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  async getNotifications(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.notificationService.getNotificationsWithDetails(
      parseInt(userId),
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20,
    );
  }

  @Get('user/:userId/unread-count')
  async getUnreadCount(@Param('userId') userId: string) {
    const count = await this.notificationService.getUnreadCount(parseInt(userId));
    return { count };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(parseInt(id));
  }

  @Post('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(parseInt(userId));
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(parseInt(id));
  }
}
