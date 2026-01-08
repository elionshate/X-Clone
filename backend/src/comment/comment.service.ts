import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentDto, UpdateCommentLikesDto, CreateReplyDto } from './dto/comment.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createComment(createCommentDto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        authorId: createCommentDto.authorId,
        tweetId: createCommentDto.tweetId,
      },
      include: {
        author: true,
        tweet: {
          include: { author: true },
        },
      },
    });

    // Create notification for the tweet owner
    if (comment.tweet.authorId !== createCommentDto.authorId) {
      await this.notificationService.createNotification({
        type: 'comment',
        userId: comment.tweet.authorId,
        actorId: createCommentDto.authorId,
        tweetId: createCommentDto.tweetId,
        commentId: comment.id,
      });
    }

    return comment;
  }

  // Create a reply to a comment
  async createReply(createReplyDto: CreateReplyDto) {
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: createReplyDto.parentId },
      include: { author: true },
    });

    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    const reply = await this.prisma.comment.create({
      data: {
        content: createReplyDto.content,
        authorId: createReplyDto.authorId,
        tweetId: createReplyDto.tweetId,
        parentId: createReplyDto.parentId,
      },
      include: {
        author: true,
        parent: {
          include: { author: true },
        },
        tweet: {
          include: { author: true },
        },
      },
    });

    // Create notification for the parent comment author
    if (parentComment.authorId !== createReplyDto.authorId) {
      await this.notificationService.createNotification({
        type: 'comment_reply',
        userId: parentComment.authorId,
        actorId: createReplyDto.authorId,
        tweetId: createReplyDto.tweetId,
        commentId: reply.id,
      });
    }

    return reply;
  }

  // Get replies for a comment
  async getRepliesByCommentId(commentId: number, skip = 0, take = 10) {
    return this.prisma.comment.findMany({
      where: { parentId: commentId },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
      include: {
        author: true,
        likes: true,
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  async getCommentById(id: number) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        tweet: true,
        replies: {
          include: { author: true },
          take: 3,
        },
        likes: true,
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  async getCommentsByTweetId(tweetId: number, skip = 0, take = 20) {
    return this.prisma.comment.findMany({
      where: { tweetId, parentId: null }, // Only top-level comments
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
        likes: true,
        replies: {
          include: { author: true, likes: true },
          take: 3,
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  async getCommentsByUserId(userId: number, skip = 0, take = 10) {
    return this.prisma.comment.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
        tweet: true,
      },
    });
  }

  // Get all comments on a user's posts (for the Comments tab)
  async getCommentsOnUserPosts(userId: number, skip = 0, take = 20) {
    return this.prisma.comment.findMany({
      where: {
        tweet: {
          authorId: userId, // Only comments on this user's tweets
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
        tweet: {
          include: {
            author: true,
            media: true,
          },
        },
        parent: {
          include: { author: true },
        },
        likes: true,
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  async updateComment(id: number, content: string) {
    return this.prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: true,
        tweet: true,
      },
    });
  }

  async deleteComment(id: number) {
    return this.prisma.comment.delete({
      where: { id },
    });
  }

  async updateCommentLikes(id: number, updateDto: UpdateCommentLikesDto) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        likeCount: updateDto.likeCount,
      },
      include: {
        author: true,
        tweet: true,
      },
    });
  }

  // Like a comment with notification
  async likeComment(commentId: number, userId: number) {
    // Check if already liked
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      return { message: 'Already liked' };
    }

    // Create the like
    const like = await this.prisma.commentLike.create({
      data: {
        userId,
        commentId,
      },
    });

    // Increment like count
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        likeCount: { increment: 1 },
      },
    });

    // Get comment for notification
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { tweet: true },
    });

    // Create notification for comment author
    if (comment && comment.authorId !== userId) {
      await this.notificationService.createNotification({
        type: 'comment_like',
        userId: comment.authorId,
        actorId: userId,
        tweetId: comment.tweetId,
        commentId: commentId,
      });
    }

    return like;
  }

  // Unlike a comment
  async unlikeComment(commentId: number, userId: number) {
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (!existingLike) {
      return { message: 'Not liked' };
    }

    // Delete the like
    await this.prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    // Decrement like count
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        likeCount: { decrement: 1 },
      },
    });

    return { message: 'Unliked' };
  }

  // Check if user has liked a comment
  async hasUserLikedComment(commentId: number, userId: number) {
    const like = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });
    return { liked: !!like };
  }

  async incrementCommentLikes(id: number) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementCommentLikes(id: number) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });
  }

  async getCommentCount(tweetId: number) {
    return this.prisma.comment.count({
      where: { tweetId },
    });
  }

  // Increment comment view count
  async incrementViewCount(id: number) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  // Increment view count for multiple comments
  async incrementViewCountBatch(ids: number[]) {
    return this.prisma.comment.updateMany({
      where: { id: { in: ids } },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  // Bookmark a comment
  async bookmarkComment(commentId: number, userId: number) {
    const existingBookmark = await this.prisma.commentBookmark.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (existingBookmark) {
      return { message: 'Already bookmarked' };
    }

    return this.prisma.commentBookmark.create({
      data: { userId, commentId },
    });
  }

  // Remove bookmark from comment
  async unbookmarkComment(commentId: number, userId: number) {
    const existingBookmark = await this.prisma.commentBookmark.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (!existingBookmark) {
      return { message: 'Not bookmarked' };
    }

    await this.prisma.commentBookmark.delete({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    return { message: 'Unbookmarked' };
  }

  // Check if user has bookmarked a comment
  async hasUserBookmarkedComment(commentId: number, userId: number) {
    const bookmark = await this.prisma.commentBookmark.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });
    return { bookmarked: !!bookmark };
  }

  // Get user's bookmarked comments
  async getBookmarkedComments(userId: number, skip = 0, take = 20) {
    const bookmarks = await this.prisma.commentBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        comment: {
          include: {
            author: true,
            tweet: {
              include: { author: true, media: true },
            },
            likes: true,
            _count: { select: { replies: true } },
          },
        },
      },
    });
    return bookmarks.map((b) => b.comment);
  }

  // Retweet a comment
  async retweetComment(commentId: number, userId: number) {
    const existingRetweet = await this.prisma.commentRetweet.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (existingRetweet) {
      return { message: 'Already retweeted' };
    }

    const retweet = await this.prisma.commentRetweet.create({
      data: { userId, commentId },
    });

    // Increment retweet count
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { retweetCount: { increment: 1 } },
    });

    // Create notification for comment author
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (comment && comment.authorId !== userId) {
      await this.notificationService.createNotification({
        type: 'comment_retweet',
        userId: comment.authorId,
        actorId: userId,
        tweetId: comment.tweetId,
        commentId: commentId,
      });
    }

    return retweet;
  }

  // Remove retweet from comment
  async unretweetComment(commentId: number, userId: number) {
    const existingRetweet = await this.prisma.commentRetweet.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (!existingRetweet) {
      return { message: 'Not retweeted' };
    }

    await this.prisma.commentRetweet.delete({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    // Decrement retweet count
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { retweetCount: { decrement: 1 } },
    });

    return { message: 'Unretweeted' };
  }

  // Check if user has retweeted a comment
  async hasUserRetweetedComment(commentId: number, userId: number) {
    const retweet = await this.prisma.commentRetweet.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });
    return { retweeted: !!retweet };
  }

  // Get comments with full interaction data for a tweet
  async getCommentsWithInteractions(tweetId: number, userId: number, skip = 0, take = 20) {
    const comments = await this.prisma.comment.findMany({
      where: { tweetId, parentId: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: true,
        likes: true,
        bookmarks: true,
        retweets: true,
        replies: {
          include: {
            author: true,
            likes: true,
            _count: { select: { replies: true } },
          },
          take: 3,
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { replies: true } },
      },
    });

    // Add user interaction flags
    return comments.map((comment) => ({
      ...comment,
      isLiked: comment.likes.some((like) => like.userId === userId),
      isBookmarked: comment.bookmarks.some((b) => b.userId === userId),
      isRetweeted: comment.retweets.some((r) => r.userId === userId),
      replies: comment.replies.map((reply) => ({
        ...reply,
        isLiked: reply.likes.some((like) => like.userId === userId),
      })),
    }));
  }
}
