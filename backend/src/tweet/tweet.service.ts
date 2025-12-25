import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTweetDto, UpdateTweetLikesDto } from './dto/tweet.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TweetService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createTweet(createTweetDto: CreateTweetDto) {
    const tweet = await this.prisma.tweet.create({
      data: {
        content: createTweetDto.content,
        authorId: createTweetDto.authorId,
        commentsEnabled: createTweetDto.commentsEnabled ?? true,
        location: createTweetDto.location,
        latitude: createTweetDto.latitude,
        longitude: createTweetDto.longitude,
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

  async getAllTweets(skip = 0, take = 10, excludeUserId?: number) {
    return this.prisma.tweet.findMany({
      where: excludeUserId ? { authorId: { not: excludeUserId } } : undefined,
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

  async incrementLikes(id: number, actorId?: number) {
    const tweet = await this.prisma.tweet.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
      include: { author: true },
    });

    // Create like record if actorId is provided
    if (actorId) {
      await this.prisma.like.upsert({
        where: {
          userId_tweetId: {
            userId: actorId,
            tweetId: id,
          },
        },
        update: {},
        create: {
          userId: actorId,
          tweetId: id,
        },
      });

      // Create notification for the tweet owner
      if (tweet.authorId !== actorId) {
        await this.notificationService.createNotification({
          type: 'like',
          userId: tweet.authorId,
          actorId,
          tweetId: id,
        });
      }
    }

    return tweet;
  }

  async decrementLikes(id: number, actorId?: number) {
    const tweet = await this.prisma.tweet.update({
      where: { id },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });

    // Remove like record if actorId is provided
    if (actorId) {
      await this.prisma.like.deleteMany({
        where: {
          userId: actorId,
          tweetId: id,
        },
      });
    }

    return tweet;
  }

  async incrementRetweets(id: number, actorId?: number) {
    const tweet = await this.prisma.tweet.update({
      where: { id },
      data: {
        retweetCount: {
          increment: 1,
        },
      },
      include: { author: true },
    });

    // Create retweet record if actorId is provided
    if (actorId) {
      await this.prisma.retweet.upsert({
        where: {
          userId_tweetId: {
            userId: actorId,
            tweetId: id,
          },
        },
        update: {},
        create: {
          userId: actorId,
          tweetId: id,
        },
      });

      // Create notification for the tweet owner
      if (tweet.authorId !== actorId) {
        await this.notificationService.createNotification({
          type: 'retweet',
          userId: tweet.authorId,
          actorId,
          tweetId: id,
        });
      }
    }

    return tweet;
  }

  async decrementRetweets(id: number, actorId?: number) {
    const tweet = await this.prisma.tweet.update({
      where: { id },
      data: {
        retweetCount: {
          decrement: 1,
        },
      },
    });

    // Remove retweet record if actorId is provided
    if (actorId) {
      await this.prisma.retweet.deleteMany({
        where: {
          userId: actorId,
          tweetId: id,
        },
      });
    }

    return tweet;
  }

  // Get all tweets that a user has retweeted
  async getRetweetsByUserId(userId: number, skip = 0, take = 10) {
    const retweets = await this.prisma.retweet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        tweet: {
          include: {
            author: true,
            media: true,
            comments: {
              include: { author: true },
              orderBy: { createdAt: 'desc' },
              take: 2,
            },
          },
        },
      },
    });

    // Return tweets with a retweetedAt timestamp
    return retweets.map(rt => ({
      ...rt.tweet,
      retweetedAt: rt.createdAt,
      isRetweet: true,
    }));
  }

  // Check if user has retweeted a specific tweet
  async hasUserRetweeted(userId: number, tweetId: number) {
    const retweet = await this.prisma.retweet.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });
    return !!retweet;
  }

  async searchTweets(query: string, userId?: number) {
    // Get blocked users if userId provided
    let blockedIds: number[] = [];
    if (userId) {
      const blockedByUser = await this.prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      });
      const blockedUser = await this.prisma.block.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      });
      blockedIds = [
        ...blockedByUser.map(b => b.blockedId),
        ...blockedUser.map(b => b.blockerId),
      ];
    }

    return this.prisma.tweet.findMany({
      where: {
        content: {
          contains: query,
        },
        ...(blockedIds.length > 0 && { authorId: { notIn: blockedIds } }),
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

    // Get blocked users (both directions)
    const blockedByUser = await this.prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blockedUser = await this.prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    });
    const blockedIds = [
      ...blockedByUser.map(b => b.blockedId),
      ...blockedUser.map(b => b.blockerId),
    ];

    // Get tweets from followed users AND the current user's own tweets, excluding blocked
    return this.prisma.tweet.findMany({
      where: {
        authorId: {
          in: [...followingIds, userId].filter(id => !blockedIds.includes(id)),
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

  async getForYouTweets(userId: number, skip = 0, take = 10) {
    // Get the list of users that the current user follows
    const following = await this.prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    // Get blocked users (both directions)
    const blockedByUser = await this.prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blockedUser = await this.prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    });
    const blockedIds = [
      ...blockedByUser.map(b => b.blockedId),
      ...blockedUser.map(b => b.blockerId),
    ];

    // Get tweets from users NOT followed, BUT include current user's own tweets, excluding blocked
    return this.prisma.tweet.findMany({
      where: {
        AND: [
          {
            OR: [
              { authorId: userId }, // Include user's own tweets
              { authorId: { notIn: [...followingIds, userId] } }, // Tweets from unfollowed users
            ],
          },
          { authorId: { notIn: blockedIds } }, // Exclude blocked users
        ],
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

  async updateTweetContent(id: number, content: string) {
    return this.prisma.tweet.update({
      where: { id },
      data: { content },
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

  async updateTweet(
    id: number,
    data: {
      content?: string;
      mediaUrls?: string[];
      mediaIdsToRemove?: number[];
      location?: string;
      latitude?: number;
      longitude?: number;
      commentsEnabled?: boolean;
    },
  ) {
    // First, remove any media that should be deleted
    if (data.mediaIdsToRemove && data.mediaIdsToRemove.length > 0) {
      await this.prisma.tweetMedia.deleteMany({
        where: {
          id: { in: data.mediaIdsToRemove },
          tweetId: id,
        },
      });
    }

    // Add new media if provided
    if (data.mediaUrls && data.mediaUrls.length > 0) {
      await this.prisma.tweetMedia.createMany({
        data: data.mediaUrls.map((url) => ({
          tweetId: id,
          mediaUrl: url,
          mediaType: url.startsWith('data:video') ? 'video' : 'image',
        })),
      });
    }

    // Update tweet fields (excluding createdAt which is immutable)
    return this.prisma.tweet.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.commentsEnabled !== undefined && { commentsEnabled: data.commentsEnabled }),
        // Note: createdAt is NEVER updated - it's immutable
      },
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

  async incrementViews(id: number) {
    return this.prisma.tweet.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async incrementViewsBatch(ids: number[]) {
    return this.prisma.tweet.updateMany({
      where: { id: { in: ids } },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  // Get all tweets that a user has liked
  async getLikesByUserId(userId: number, skip = 0, take = 10) {
    const likes = await this.prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        tweet: {
          include: {
            author: true,
            media: true,
            comments: {
              include: { author: true },
              orderBy: { createdAt: 'desc' },
              take: 2,
            },
          },
        },
      },
    });

    // Return tweets with a likedAt timestamp
    return likes.map(like => ({
      ...like.tweet,
      likedAt: like.createdAt,
      isLiked: true,
    }));
  }

  // Check if user has liked a specific tweet
  async hasUserLiked(userId: number, tweetId: number) {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });
    return !!like;
  }

  // Get all liked tweet IDs for a user (for UI state)
  async getLikedTweetIds(userId: number) {
    const likes = await this.prisma.like.findMany({
      where: { userId },
      select: { tweetId: true },
    });
    return likes.map(like => like.tweetId);
  }
}
