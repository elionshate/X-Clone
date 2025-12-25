import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TweetModule } from './tweet/tweet.module';
import { CommentModule } from './comment/comment.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    TweetModule,
    CommentModule,
    BookmarkModule,
    ChatModule,
    NotificationModule,
  ],
})
export class AppModule {}
