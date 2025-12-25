import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { NotificationService } from '../notification/notification.service';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class UserService {
  private clerkClient: ReturnType<typeof createClerkClient>;

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {
    // Initialize Clerk client
    this.clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    // Use upsert to handle race conditions when multiple requests try to create the same user
    const user = await this.prisma.user.upsert({
      where: { username: createUserDto.username },
      update: {}, // Don't update anything if user exists
      create: {
        email: createUserDto.email,
        username: createUserDto.username,
        name: createUserDto.name,
        bio: createUserDto.bio || '',
        avatar: createUserDto.avatar,
      },
    });

    // Set up initial follows and messages for new users
    await this.setupNewUserConnections(user.id);

    return user;
  }

  // Set up follows and messages for a new user
  async setupNewUserConnections(userId: number) {
    try {
      // Get "followable" seed users (alice, bob, charlie, diana, evan - the first 5)
      // These are users the new user will follow (for "Following" feed)
      const followableSeedUsers = await this.prisma.user.findMany({
        where: {
          email: { contains: '@example.com' },
          username: {
            in: ['alice_wonder', 'bob_builder', 'charlie_coding', 'diana_design', 'evan_explorer'],
          },
        },
      });

      // Get ALL seed users for them to follow the new user
      const allSeedUsers = await this.prisma.user.findMany({
        where: {
          email: { contains: '@example.com' },
        },
      });

      if (allSeedUsers.length === 0) return;

      // Make ALL seed users follow the new user
      for (const seedUser of allSeedUsers) {
        const existingFollow = await this.prisma.userFollow.findFirst({
          where: { followerId: seedUser.id, followingId: userId },
        });
        if (!existingFollow) {
          await this.prisma.userFollow.create({
            data: { followerId: seedUser.id, followingId: userId },
          }).catch(() => {}); // Ignore if already exists
        }
      }

      // Make the new user follow ONLY the "followable" seed users (not the unfollowed ones)
      // This ensures "For You" feed shows posts from unfollowed users
      for (const seedUser of followableSeedUsers) {
        const existingFollow = await this.prisma.userFollow.findFirst({
          where: { followerId: userId, followingId: seedUser.id },
        });
        if (!existingFollow) {
          await this.prisma.userFollow.create({
            data: { followerId: userId, followingId: seedUser.id },
          }).catch(() => {}); // Ignore if already exists
        }
      }

      // Create welcome chats with the first followable seed user
      const welcomeUser = followableSeedUsers[0];
      if (welcomeUser) {
        // Check if chat already exists
        const existingChat = await this.prisma.chat.findFirst({
          where: {
            isGroup: false,
            AND: [
              { members: { some: { userId: userId } } },
              { members: { some: { userId: welcomeUser.id } } },
            ],
          },
        });

        if (!existingChat) {
          const chat = await this.prisma.chat.create({
            data: {
              isGroup: false,
              members: {
                create: [
                  { userId: userId },
                  { userId: welcomeUser.id },
                ],
              },
            },
          });

          // Add welcome messages
          await this.prisma.message.create({
            data: {
              chatId: chat.id,
              senderId: welcomeUser.id,
              content: `Welcome to X Clone! 👋 I'm ${welcomeUser.name}, nice to meet you!`,
            },
          });
          await this.prisma.message.create({
            data: {
              chatId: chat.id,
              senderId: welcomeUser.id,
              content: 'Feel free to explore and post your first tweet! 🚀',
            },
          });
        }
      }
    } catch (error) {
      console.error('Error setting up new user connections:', error);
      // Don't throw - this is optional setup
    }
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

  async getUserByUsername(username: string, requestingUserId?: number) {
    const user = await this.prisma.user.findUnique({
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

    // If requesting user ID provided, check if blocked
    if (user && requestingUserId && user.id !== requestingUserId) {
      const isBidirectionallyBlocked = await this.isBidirectionallyBlocked(requestingUserId, user.id);
      if (isBidirectionallyBlocked) {
        return null; // Return null to indicate user not found (hidden due to block)
      }
    }

    return user;
  }

  // Check if there's a block in either direction between two users
  async isBidirectionallyBlocked(userId1: number, userId2: number) {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedId: userId2 },
          { blockerId: userId2, blockedId: userId1 },
        ],
      },
    });
    return !!block;
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
    const follow = await this.prisma.userFollow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Create notification for the user being followed
    await this.notificationService.createNotification({
      type: 'follow',
      userId: followingId,
      actorId: followerId,
    });

    return follow;
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

  async deleteUser(id: number, clerkUserId?: string) {
    // Delete from Clerk first if clerkUserId is provided
    if (clerkUserId) {
      try {
        await this.clerkClient.users.deleteUser(clerkUserId);
        console.log(`Deleted user ${clerkUserId} from Clerk`);
      } catch (error) {
        console.error('Error deleting user from Clerk:', error);
        // Continue with database deletion even if Clerk fails
      }
    }

    // Delete all related data first (in order of dependencies)
    await this.prisma.notification.deleteMany({
      where: { OR: [{ userId: id }, { actorId: id }] },
    });
    await this.prisma.report.deleteMany({
      where: { OR: [{ reporterId: id }, { reportedId: id }] },
    });
    await this.prisma.mute.deleteMany({
      where: { OR: [{ muterId: id }, { mutedId: id }] },
    });
    await this.prisma.block.deleteMany({
      where: { OR: [{ blockerId: id }, { blockedId: id }] },
    });
    await this.prisma.message.deleteMany({
      where: { senderId: id },
    });
    await this.prisma.chatMember.deleteMany({
      where: { userId: id },
    });
    await this.prisma.bookmark.deleteMany({
      where: { userId: id },
    });
    await this.prisma.comment.deleteMany({
      where: { authorId: id },
    });
    await this.prisma.tweetMedia.deleteMany({
      where: { tweet: { authorId: id } },
    });
    await this.prisma.tweet.deleteMany({
      where: { authorId: id },
    });
    await this.prisma.userFollow.deleteMany({
      where: { OR: [{ followerId: id }, { followingId: id }] },
    });

    // Finally delete the user
    return this.prisma.user.delete({
      where: { id },
    });
  }

  // Block functionality
  async blockUser(blockerId: number, blockedId: number) {
    // Also unfollow the user if following
    await this.prisma.userFollow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });

    return this.prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });
  }

  async unblockUser(blockerId: number, blockedId: number) {
    return this.prisma.block.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });
  }

  async isBlocked(blockerId: number, blockedId: number) {
    const block = await this.prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
    return !!block;
  }

  async getBlockedUsers(userId: number) {
    return this.prisma.block.findMany({
      where: { blockerId: userId },
      include: { blocked: true },
    });
  }

  // Mute functionality
  async muteUser(muterId: number, mutedId: number) {
    return this.prisma.mute.create({
      data: {
        muterId,
        mutedId,
      },
    });
  }

  async unmuteUser(muterId: number, mutedId: number) {
    return this.prisma.mute.deleteMany({
      where: {
        muterId,
        mutedId,
      },
    });
  }

  async isMuted(muterId: number, mutedId: number) {
    const mute = await this.prisma.mute.findUnique({
      where: {
        muterId_mutedId: {
          muterId,
          mutedId,
        },
      },
    });
    return !!mute;
  }

  async getMutedUsers(userId: number) {
    return this.prisma.mute.findMany({
      where: { muterId: userId },
      include: { muted: true },
    });
  }

  // Report functionality
  async reportUser(reporterId: number, reportedId: number, reason: string) {
    return this.prisma.report.create({
      data: {
        reporterId,
        reportedId,
        reason,
      },
    });
  }

  async getReportsByUser(userId: number) {
    return this.prisma.report.findMany({
      where: { reporterId: userId },
      include: { reported: true },
    });
  }

  // Get user relationship status (for profile page)
  async getUserRelationshipStatus(currentUserId: number, targetUserId: number) {
    const [isFollowing, isBlocked, isMuted, isBlockedBy] = await Promise.all([
      this.isFollowing(currentUserId, targetUserId),
      this.isBlocked(currentUserId, targetUserId),
      this.isMuted(currentUserId, targetUserId),
      this.isBlocked(targetUserId, currentUserId),
    ]);

    return {
      isFollowing,
      isBlocked,
      isMuted,
      isBlockedBy,
    };
  }
}
