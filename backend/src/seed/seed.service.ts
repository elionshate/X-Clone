import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedIfEmpty();
  }

  async seedIfEmpty() {
    // Check if seed data already exists
    const tweetCount = await this.prisma.tweet.count();
    const seedUserCount = await this.prisma.user.count({
      where: { email: { contains: '@example.com' } },
    });

    if (tweetCount > 0 && seedUserCount > 0) {
      console.log('📊 Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Seeding database...');
    await this.seed();
  }

  async seed() {
    // Get all real users (non-example.com emails)
    const realUsers = await this.prisma.user.findMany({
      where: {
        NOT: { email: { contains: '@example.com' } },
      },
    });

    // Create seed users
    const seedUsers = await this.createSeedUsers();
    const followedUsers = seedUsers.slice(0, 5);
    const unfollowedUsers = seedUsers.slice(5);

    // Create follow relationships between seed users
    await this.createSeedUserFollows(followedUsers);

    // Create tweets from all seed users
    await this.createSeedTweets(followedUsers, unfollowedUsers, [...seedUsers, ...realUsers]);

    // For each real user, set up their relationships
    for (const realUser of realUsers) {
      await this.setupUserRelationships(realUser.id, followedUsers, unfollowedUsers, seedUsers);
    }

    console.log('✅ Database seeded successfully!');
    console.log('📊 Created:');
    console.log('   - 5 followed seed users (alice, bob, charlie, diana, evan)');
    console.log('   - 6 unfollowed seed users (frank, grace, henry, ivy, jack, kate)');
    console.log('   - 20 tweets from followed users');
    console.log('   - 120 tweets from unfollowed users');
    console.log(`   - Relationships for ${realUsers.length} real user(s)`);
  }

  async createSeedUsers() {
    const seedUserData = [
      // Followed users (first 5)
      { email: 'alice@example.com', username: 'alice_wonder', name: 'Alice Wonder', bio: 'Tech enthusiast and coffee lover ☕', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
      { email: 'bob@example.com', username: 'bob_builder', name: 'Bob Builder', bio: 'Building awesome stuff 🚀', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob' },
      { email: 'charlie@example.com', username: 'charlie_coding', name: 'Charlie Code', bio: 'Full-stack developer | Open source lover', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie' },
      { email: 'diana@example.com', username: 'diana_design', name: 'Diana Designer', bio: 'UI/UX Designer | Creative mind 🎨', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana' },
      { email: 'evan@example.com', username: 'evan_explorer', name: 'Evan Explorer', bio: 'Travel blogger and photographer 📸', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=evan' },
      // Unfollowed users (next 6)
      { email: 'frank@example.com', username: 'frank_fitness', name: 'Frank Fitness', bio: 'Personal trainer | Health & Wellness advocate 💪', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank' },
      { email: 'grace@example.com', username: 'grace_gamer', name: 'Grace Gamer', bio: 'Pro gamer | Streamer | Esports enthusiast 🎮', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace' },
      { email: 'henry@example.com', username: 'henry_hacker', name: 'Henry Hacker', bio: 'Cybersecurity expert | Bug bounty hunter 🔒', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry' },
      { email: 'ivy@example.com', username: 'ivy_investor', name: 'Ivy Investor', bio: 'Angel investor | Startup advisor | Finance tips 📈', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivy' },
      { email: 'jack@example.com', username: 'jack_journalist', name: 'Jack Journalist', bio: 'Tech journalist | Breaking news | Industry insights 📰', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jack' },
      { email: 'kate@example.com', username: 'kate_kitchen', name: 'Kate Kitchen', bio: 'Chef | Food blogger | Recipe creator 🍳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kate' },
    ];

    const users: any[] = [];
    for (const userData of seedUserData) {
      const user = await this.prisma.user.upsert({
        where: { username: userData.username },
        update: {},
        create: userData,
      });
      users.push(user);
    }
    return users;
  }

  async createSeedUserFollows(followedUsers: any[]) {
    // Seed users follow each other
    const followPairs = [
      [0, 1], [0, 2], [1, 0], [1, 3], [2, 4], [3, 0], [4, 1],
    ];

    for (const [followerIdx, followingIdx] of followPairs) {
      await this.prisma.userFollow.upsert({
        where: {
          followerId_followingId: {
            followerId: followedUsers[followerIdx].id,
            followingId: followedUsers[followingIdx].id,
          },
        },
        update: {},
        create: {
          followerId: followedUsers[followerIdx].id,
          followingId: followedUsers[followingIdx].id,
        },
      });
    }
  }

  async createSeedTweets(followedUsers: any[], unfollowedUsers: any[], allUsers: any[]) {
    const followedTweetContents = [
      'Just launched my new project! Check it out 🚀',
      'Coffee and code - the perfect combination ☕💻',
      'Learning React hooks has been a game changer for me',
      'Beautiful sunset at the beach today 🌅',
      'Who else thinks TypeScript is amazing?',
      'Working on an exciting new feature today!',
      'Just finished reading an amazing book on system design',
      'The weather is perfect for a coding marathon 🤖',
      'Deployed to production without a single bug (yes really!)',
      'Debugging at 3am, but finally fixed it! 🎉',
      'Need your feedback on my new design mockups',
      'Excited to announce I\'m speaking at a tech conference!',
      'Hot take: Dark mode should be the default everywhere',
      'Working from the coffee shop today, super productive',
      'Just discovered this amazing open source library',
      'Building with Nest.js and Prisma is such a joy',
      'Your code at 2pm vs your code at 2am 😅',
      'Finally understanding async/await properly!',
      'Nothing beats the feeling of shipping code',
      'Why is git merge so confusing? 🤔',
    ];

    const unfollowedTweetContents = [
      '💪 Morning workout complete! Start your day with energy!',
      'New personal record on deadlift today! 🏋️‍♂️',
      'Remember: consistency beats intensity. Show up every day!',
      'Healthy meal prep Sunday - fueling the week ahead 🥗',
      '🎮 Just hit Diamond rank in Valorant! Grind pays off',
      'Stream starting in 10 minutes! Come hang out 🔴',
      'That ending in the new game was INSANE 🤯',
      'Hot take: The new update actually made the game better',
      '🔒 Found a critical vulnerability today. Responsible disclosure time!',
      'Security tip: Never reuse passwords across sites',
      'Just earned another bug bounty! The hunt continues 🎯',
      'Attending DEF CON next month. Who else is going?',
      '📈 Market analysis: Tech stocks looking bullish this quarter',
      'Excited to announce our latest investment in an AI startup!',
      'Startup tip: Focus on product-market fit before scaling',
      'Quarterly returns looking strong. Patience is key! 💰',
      '📰 BREAKING: Major tech company announces layoffs',
      'Just published my investigation on AI ethics in Big Tech',
      'Interview with the CEO coming tomorrow - stay tuned!',
      'The future of journalism is digital-first. Adapt or fade.',
      '🍳 New recipe alert: 15-minute pasta that tastes gourmet!',
      'Kitchen tip: Always let your meat rest before cutting',
      'Made the most amazing chocolate soufflé tonight 🍫',
      'Who else thinks cilantro is actually delicious? 🌿',
    ];

    // Create 20 tweets from followed users
    for (let i = 0; i < 20; i++) {
      const randomUser = followedUsers[Math.floor(Math.random() * followedUsers.length)];
      const randomLikes = Math.floor(Math.random() * 500);
      const randomRetweets = Math.floor(Math.random() * 200);
      const commentsEnabled = Math.random() > 0.2;

      const tweet = await this.prisma.tweet.create({
        data: {
          content: followedTweetContents[i % followedTweetContents.length],
          authorId: randomUser.id,
          likeCount: randomLikes,
          retweetCount: randomRetweets,
          commentsEnabled,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Add comments to some tweets
      if (commentsEnabled && Math.random() > 0.5 && allUsers.length > 0) {
        const commentUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        await this.prisma.comment.create({
          data: {
            content: 'Great post! Love this! ❤️',
            authorId: commentUser.id,
            tweetId: tweet.id,
            likeCount: Math.floor(Math.random() * 50),
          },
        });
      }
    }

    // Create 20 tweets from each unfollowed user
    for (const unfollowedUser of unfollowedUsers) {
      for (let i = 0; i < 20; i++) {
        const randomLikes = Math.floor(Math.random() * 1000);
        const randomRetweets = Math.floor(Math.random() * 500);
        const commentsEnabled = Math.random() > 0.1;
        const contentIndex = Math.floor(Math.random() * unfollowedTweetContents.length);

        const tweet = await this.prisma.tweet.create({
          data: {
            content: unfollowedTweetContents[contentIndex],
            authorId: unfollowedUser.id,
            likeCount: randomLikes,
            retweetCount: randomRetweets,
            commentsEnabled,
            viewCount: Math.floor(Math.random() * 5000),
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });

        if (commentsEnabled && Math.random() > 0.7 && allUsers.length > 0) {
          const commentUser = allUsers[Math.floor(Math.random() * allUsers.length)];
          await this.prisma.comment.create({
            data: {
              content: ['Amazing! 🔥', 'This is so helpful!', 'Thanks for sharing!', 'Love it! ❤️'][Math.floor(Math.random() * 4)],
              authorId: commentUser.id,
              tweetId: tweet.id,
              likeCount: Math.floor(Math.random() * 100),
            },
          });
        }
      }
    }
  }

  async setupUserRelationships(userId: number, followedUsers: any[], unfollowedUsers: any[], allSeedUsers: any[]) {
    // Make followed seed users follow the real user
    for (const seedUser of followedUsers) {
      await this.prisma.userFollow.upsert({
        where: {
          followerId_followingId: {
            followerId: seedUser.id,
            followingId: userId,
          },
        },
        update: {},
        create: {
          followerId: seedUser.id,
          followingId: userId,
        },
      });
    }

    // Make the real user follow the followed seed users
    for (const seedUser of followedUsers) {
      await this.prisma.userFollow.upsert({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: seedUser.id,
          },
        },
        update: {},
        create: {
          followerId: userId,
          followingId: seedUser.id,
        },
      });
    }

    // Create some retweets for the real user
    const followedTweets = await this.prisma.tweet.findMany({
      where: { authorId: { in: followedUsers.map(u => u.id) } },
      take: 5,
    });

    for (const tweet of followedTweets) {
      await this.prisma.retweet.upsert({
        where: {
          userId_tweetId: {
            userId: userId,
            tweetId: tweet.id,
          },
        },
        update: {},
        create: {
          userId: userId,
          tweetId: tweet.id,
        },
      });
    }

    // Create notifications for the real user
    const now = new Date();
    
    // Like notifications
    for (let i = 0; i < 5; i++) {
      const randomUser = allSeedUsers[Math.floor(Math.random() * allSeedUsers.length)];
      const randomTweet = followedTweets[Math.floor(Math.random() * followedTweets.length)];
      if (randomTweet) {
        await this.prisma.notification.create({
          data: {
            type: 'like',
            userId: userId,
            actorId: randomUser.id,
            tweetId: randomTweet.id,
            createdAt: new Date(now.getTime() - Math.random() * 60 * 60000),
          },
        });
      }
    }

    // Follow notifications
    for (const seedUser of followedUsers.slice(0, 3)) {
      await this.prisma.notification.create({
        data: {
          type: 'follow',
          userId: userId,
          actorId: seedUser.id,
          createdAt: new Date(now.getTime() - Math.random() * 120 * 60000),
        },
      });
    }

    // Create direct chats
    for (const seedUser of followedUsers.slice(0, 3)) {
      const chat = await this.prisma.chat.create({
        data: {
          name: null,
          isGroup: false,
        },
      });

      await this.prisma.chatMember.createMany({
        data: [
          { chatId: chat.id, userId: userId },
          { chatId: chat.id, userId: seedUser.id },
        ],
      });

      // Add some messages
      const messages = [
        { senderId: seedUser.id, content: `Hey! How's it going?` },
        { senderId: userId, content: 'Hey! All good, just coding! 💻' },
        { senderId: seedUser.id, content: 'Nice! What are you working on?' },
      ];

      for (const msg of messages) {
        await this.prisma.message.create({
          data: {
            chatId: chat.id,
            senderId: msg.senderId,
            content: msg.content,
            createdAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60000),
          },
        });
      }
    }
  }

  // Called when a new user signs up - sets up their relationships with seed users
  async setupNewUser(userId: number) {
    const followedUsers = await this.prisma.user.findMany({
      where: {
        email: { contains: '@example.com' },
        username: { in: ['alice_wonder', 'bob_builder', 'charlie_coding', 'diana_design', 'evan_explorer'] },
      },
    });

    const unfollowedUsers = await this.prisma.user.findMany({
      where: {
        email: { contains: '@example.com' },
        username: { in: ['frank_fitness', 'grace_gamer', 'henry_hacker', 'ivy_investor', 'jack_journalist', 'kate_kitchen'] },
      },
    });

    const allSeedUsers = [...followedUsers, ...unfollowedUsers];

    if (allSeedUsers.length > 0) {
      await this.setupUserRelationships(userId, followedUsers, unfollowedUsers, allSeedUsers);
      console.log(`✅ Set up relationships for new user ${userId}`);
    }
  }
}
