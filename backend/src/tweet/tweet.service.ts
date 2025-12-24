import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTweetDto, UpdateTweetLikesDto } from './dto/tweet.dto';

@Injectable()
export class TweetService {
  constructor(private prisma: PrismaService) {}

  async createTweet(createTweetDto: CreateTweetDto) {
    const tweet = await this.prisma.tweet.create({
      data: {
        content: createTweetDto.content,
        authorId: createTweetDto.authorId,
      },
      include: {
        author: true,
        media: true,
        comments: true,
      },
    });

    // Add media if provided
    if (createTweetDto.mediaUrls && createTweetDto.mediaUrls.length > 0) {
      for (const mediaUrl of createTweetDto.mediaUrls) {
        await this.prisma.tweetMedia.create({
          data: {
            tweetId: tweet.id,
            mediaUrl,
            mediaType: 'image',
          },
        });
      }
    }

    return this.getTweetById(tweet.id);
  }

  async getTweetById(id: number) {
    return this.prisma.tweet.findUnique({
      where: { id },
      include: {
        author: true,
        media: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getAllTweets(skip = 0, take = 10) {
    return this.prisma.tweet.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
        media: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
          take: 2,
        },
      },
    });
  }

  async getTweetsByUserId(userId: number, skip = 0, take = 10) {
    return this.prisma.tweet.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
        media: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
          take: 2,
        },
      },
    });
  }

  async deleteTweet(id: number) {
    // Delete associated media and comments (cascade should handle this)
    return this.prisma.tweet.delete({
      where: { id },
    });
  }

  async updateTweetLikes(id: number, updateDto: UpdateTweetLikesDto) {
    return this.prisma.tweet.update({
      where: { id },
      data: {
        likeCount: updateDto.likeCount,
      },
      include: {
        author: true,
        media: true,
        comments: true,
      },
    });
  }

  async updateTweetRetweets(id: number, retweetCount: number) {
    return this.prisma.tweet.update({
      where: { id },
      data: {
        retweetCount,
      },
      include: {
        author: true,
        media: true,
        comments: true,
      },
    });
  }

  async incrementLikes(id: number) {
    return this.prisma.tweet.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementLikes(id: number) {
    return this.prisma.tweet.update({
      where: { id },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });
  }

  async incrementRetweets(id: number) {
    return this.prisma.tweet.update({
      where: { id },
      data: {
        retweetCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementRetweets(id: number) {
    return this.prisma.tweet.update({
      where: { id },
      data: {
        retweetCount: {
          decrement: 1,
        },
      },
    });
  }

  async searchTweets(query: string) {
    return this.prisma.tweet.findMany({
      where: {
        content: {
          contains: query,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        media: true,
      },
    });
  }

  async getFollowingTweets(userId: number, skip = 0, take = 10) {
    // Get the list of users that the current user follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    // Get tweets from followed users
    return this.prisma.tweet.findMany({
      where: {
        authorId: {
          in: followingIds,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
        media: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
          take: 2,
        },
      },
    });
  }
}
