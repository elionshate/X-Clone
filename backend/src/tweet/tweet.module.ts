import { Module } from '@nestjs/common';
import { TweetService } from './tweet.service';
import { TweetController } from './tweet.controller';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  providers: [TweetService, PrismaService, NotificationService],
  controllers: [TweetController],
  exports: [TweetService],
})
export class TweetModule {}
