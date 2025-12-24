import { Module } from '@nestjs/common';
import { TweetService } from './tweet.service';
import { TweetController } from './tweet.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [TweetService, PrismaService],
  controllers: [TweetController],
  exports: [TweetService],
})
export class TweetModule {}
