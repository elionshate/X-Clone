import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  providers: [UserService, PrismaService, NotificationService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
