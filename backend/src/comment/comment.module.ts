import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  providers: [CommentService, PrismaService, NotificationService],
  controllers: [CommentController],
  exports: [CommentService],
})
export class CommentModule {}
