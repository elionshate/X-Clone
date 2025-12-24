import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        name: createUserDto.name,
        bio: createUserDto.bio || '',
        avatar: createUserDto.avatar,
      },
    });
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        tweets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        followers: true,
        following: true,
      },
    });
  }

  async getUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        tweets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        followers: true,
        following: true,
      },
    });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        bio: updateUserDto.bio,
        avatar: updateUserDto.avatar,
        name: updateUserDto.name,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        _count: {
          select: { tweets: true, followers: true, following: true },
        },
      },
    });
  }

  async followUser(followerId: number, followingId: number) {
    return this.prisma.userFollow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async unfollowUser(followerId: number, followingId: number) {
    return this.prisma.userFollow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });
  }

  async getFollowers(userId: number) {
    return this.prisma.userFollow.findMany({
      where: { followingId: userId },
      include: { follower: true },
    });
  }

  async getFollowing(userId: number) {
    return this.prisma.userFollow.findMany({
      where: { followerId: userId },
      include: { following: true },
    });
  }

  async isFollowing(followerId: number, followingId: number) {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return !!follow;
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
