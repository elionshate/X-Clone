import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBookmarkDto } from './dto/bookmark.dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async createBookmark(createBookmarkDto: CreateBookmarkDto) {
    return this.prisma.bookmark.create({
      data: {
        userId: createBookmarkDto.userId,
        tweetId: createBookmarkDto.tweetId,
      },
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
  }

  async removeBookmark(userId: number, tweetId: number) {
    return this.prisma.bookmark.deleteMany({
      where: {
        userId,
        tweetId,
      },
    });
  }

  async getBookmarksByUserId(userId: number, skip = 0, take = 10) {
    const bookmarks = await this.prisma.bookmark.findMany({
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

    // Return just the tweets with bookmark info
    return bookmarks.map(bookmark => ({
      ...bookmark.tweet,
      bookmarkedAt: bookmark.createdAt,
      bookmarkId: bookmark.id,
    }));
  }

  async isBookmarked(userId: number, tweetId: number) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });
    return { isBookmarked: !!bookmark };
  }

  async getBookmarkedTweetIds(userId: number) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      select: { tweetId: true },
    });
    return bookmarks.map(b => b.tweetId);
  }
}
