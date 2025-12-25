import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if the real user @elionsh exists - preserve them
  const realUser = await prisma.user.findUnique({
    where: { username: 'elionsh' },
  });

  // Clear existing data (in order of dependencies) - but preserve real user
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.mute.deleteMany();
  await prisma.block.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.tweetMedia.deleteMany();
  await prisma.retweet.deleteMany();
  await prisma.tweet.deleteMany();
  await prisma.userFollow.deleteMany();
  
  // Delete only seed users (those with @example.com emails), preserve real users
  await prisma.user.deleteMany({
    where: {
      email: { contains: '@example.com' },
    },
  });

  // Create 5 mock users that @elionsh will follow
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice_wonder',
      name: 'Alice Wonder',
      bio: 'Tech enthusiast and coffee lover ☕',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob_builder',
      name: 'Bob Builder',
      bio: 'Building awesome stuff 🚀',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      username: 'charlie_coding',
      name: 'Charlie Code',
      bio: 'Full-stack developer | Open source lover',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'diana@example.com',
      username: 'diana_design',
      name: 'Diana Designer',
      bio: 'UI/UX Designer | Creative mind 🎨',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
    },
  });

  const user5 = await prisma.user.create({
    data: {
      email: 'evan@example.com',
      username: 'evan_explorer',
      name: 'Evan Explorer',
      bio: 'Travel blogger and photographer 📸',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=evan',
    },
  });

  const followedUsers = [user1, user2, user3, user4, user5];

  // Create 6 extra users that @elionsh will NOT follow (for "For You" feed)
  const unfollowedUser1 = await prisma.user.create({
    data: {
      email: 'frank@example.com',
      username: 'frank_fitness',
      name: 'Frank Fitness',
      bio: 'Personal trainer | Health & Wellness advocate 💪',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank',
    },
  });

  const unfollowedUser2 = await prisma.user.create({
    data: {
      email: 'grace@example.com',
      username: 'grace_gamer',
      name: 'Grace Gamer',
      bio: 'Pro gamer | Streamer | Esports enthusiast 🎮',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace',
    },
  });

  const unfollowedUser3 = await prisma.user.create({
    data: {
      email: 'henry@example.com',
      username: 'henry_hacker',
      name: 'Henry Hacker',
      bio: 'Cybersecurity expert | Bug bounty hunter 🔒',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry',
    },
  });

  const unfollowedUser4 = await prisma.user.create({
    data: {
      email: 'ivy@example.com',
      username: 'ivy_investor',
      name: 'Ivy Investor',
      bio: 'Angel investor | Startup advisor | Finance tips 📈',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivy',
    },
  });

  const unfollowedUser5 = await prisma.user.create({
    data: {
      email: 'jack@example.com',
      username: 'jack_journalist',
      name: 'Jack Journalist',
      bio: 'Tech journalist | Breaking news | Industry insights 📰',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jack',
    },
  });

  const unfollowedUser6 = await prisma.user.create({
    data: {
      email: 'kate@example.com',
      username: 'kate_kitchen',
      name: 'Kate Kitchen',
      bio: 'Chef | Food blogger | Recipe creator 🍳',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kate',
    },
  });

  const unfollowedUsers = [unfollowedUser1, unfollowedUser2, unfollowedUser3, unfollowedUser4, unfollowedUser5, unfollowedUser6];
  const allSeedUsers = [...followedUsers, ...unfollowedUsers];

  // If @elionsh exists, add them to the users array for relationships
  let elionshUser = realUser;
  if (!elionshUser) {
    elionshUser = await prisma.user.upsert({
      where: { username: 'elionsh' },
      update: {},
      create: {
        email: 'elionsh@user.com',
        username: 'elionsh',
        name: 'Elionsh',
        bio: 'Welcome to my X Clone profile! 🚀',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elionsh',
      },
    });
  }

  const allUsers = [...allSeedUsers, elionshUser];

  // Create follow relationships - seed users follow each other
  await prisma.userFollow.create({ data: { followerId: user1.id, followingId: user2.id } });
  await prisma.userFollow.create({ data: { followerId: user1.id, followingId: user3.id } });
  await prisma.userFollow.create({ data: { followerId: user2.id, followingId: user1.id } });
  await prisma.userFollow.create({ data: { followerId: user2.id, followingId: user4.id } });
  await prisma.userFollow.create({ data: { followerId: user3.id, followingId: user5.id } });
  await prisma.userFollow.create({ data: { followerId: user4.id, followingId: user1.id } });
  await prisma.userFollow.create({ data: { followerId: user5.id, followingId: user2.id } });

  // ALL followed seed users follow @elionsh
  for (const seedUser of followedUsers) {
    await prisma.userFollow.create({
      data: { followerId: seedUser.id, followingId: elionshUser.id },
    });
  }

  // @elionsh follows ONLY the first 5 users (followedUsers), NOT the unfollowedUsers
  for (const seedUser of followedUsers) {
    await prisma.userFollow.create({
      data: { followerId: elionshUser.id, followingId: seedUser.id },
    });
  }

  // Tweet contents for followed users
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

  // Create 20 tweets from followed users
  const followedTweets: any[] = [];
  for (let i = 0; i < 20; i++) {
    const randomUser = followedUsers[Math.floor(Math.random() * followedUsers.length)];
    const randomLikes = Math.floor(Math.random() * 500);
    const randomRetweets = Math.floor(Math.random() * 200);
    const commentsEnabled = Math.random() > 0.2;

    const tweet = await prisma.tweet.create({
      data: {
        content: followedTweetContents[i % followedTweetContents.length],
        authorId: randomUser.id,
        likeCount: randomLikes,
        retweetCount: randomRetweets,
        commentsEnabled,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    followedTweets.push(tweet);

    // Add comments to some tweets
    if (commentsEnabled && Math.random() > 0.5) {
      const commentUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      await prisma.comment.create({
        data: {
          content: 'Great post! Love this! ❤️',
          authorId: commentUser.id,
          tweetId: tweet.id,
          likeCount: Math.floor(Math.random() * 50),
        },
      });
    }
  }

  // Tweet contents for unfollowed users (For You feed)
  const unfollowedTweetContents = [
    // Frank Fitness tweets
    '💪 Morning workout complete! Start your day with energy!',
    'New personal record on deadlift today! 🏋️‍♂️',
    'Remember: consistency beats intensity. Show up every day!',
    'Healthy meal prep Sunday - fueling the week ahead 🥗',
    // Grace Gamer tweets
    '🎮 Just hit Diamond rank in Valorant! Grind pays off',
    'Stream starting in 10 minutes! Come hang out 🔴',
    'That ending in the new game was INSANE 🤯',
    'Hot take: The new update actually made the game better',
    // Henry Hacker tweets
    '🔒 Found a critical vulnerability today. Responsible disclosure time!',
    'Security tip: Never reuse passwords across sites',
    'Just earned another bug bounty! The hunt continues 🎯',
    'Attending DEF CON next month. Who else is going?',
    // Ivy Investor tweets
    '📈 Market analysis: Tech stocks looking bullish this quarter',
    'Excited to announce our latest investment in an AI startup!',
    'Startup tip: Focus on product-market fit before scaling',
    'Quarterly returns looking strong. Patience is key! 💰',
    // Jack Journalist tweets
    '📰 BREAKING: Major tech company announces layoffs',
    'Just published my investigation on AI ethics in Big Tech',
    'Interview with the CEO coming tomorrow - stay tuned!',
    'The future of journalism is digital-first. Adapt or fade.',
    // Kate Kitchen tweets
    '🍳 New recipe alert: 15-minute pasta that tastes gourmet!',
    'Kitchen tip: Always let your meat rest before cutting',
    'Made the most amazing chocolate soufflé tonight 🍫',
    'Who else thinks cilantro is actually delicious? 🌿',
  ];

  // Create 20 tweets from EACH unfollowed user (120 total for For You feed)
  const unfollowedTweets: any[] = [];
  for (const unfollowedUser of unfollowedUsers) {
    for (let i = 0; i < 20; i++) {
      const randomLikes = Math.floor(Math.random() * 1000);
      const randomRetweets = Math.floor(Math.random() * 500);
      const commentsEnabled = Math.random() > 0.1;
      const contentIndex = Math.floor(Math.random() * unfollowedTweetContents.length);

      const tweet = await prisma.tweet.create({
        data: {
          content: unfollowedTweetContents[contentIndex],
          authorId: unfollowedUser.id,
          likeCount: randomLikes,
          retweetCount: randomRetweets,
          commentsEnabled,
          viewCount: Math.floor(Math.random() * 10000),
          createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random time in last 14 days
        },
      });
      
      unfollowedTweets.push(tweet);

      // Add comments to some tweets
      if (commentsEnabled && Math.random() > 0.6) {
        const commentUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        await prisma.comment.create({
          data: {
            content: ['Amazing! 🔥', 'This is so helpful!', 'Love this content!', 'Keep it up! 👏', 'Incredible work!'][Math.floor(Math.random() * 5)],
            authorId: commentUser.id,
            tweetId: tweet.id,
            likeCount: Math.floor(Math.random() * 100),
          },
        });
      }
    }
  }

  // Create some retweets by @elionsh
  const tweetsToRetweet = followedTweets.slice(0, 5);
  for (const tweet of tweetsToRetweet) {
    await prisma.retweet.create({
      data: {
        userId: elionshUser.id,
        tweetId: tweet.id,
      },
    });
    await prisma.tweet.update({
      where: { id: tweet.id },
      data: { retweetCount: { increment: 1 } },
    });
  }

  // Create direct chats and messages
  const now = new Date();
  
  // Chat 1: Alice and Bob
  const chat1 = await prisma.chat.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: user1.id },
          { userId: user2.id },
        ],
      },
    },
  });

  const chat1Messages = [
    { senderId: user1.id, content: 'Hey Bob! How are you?', minutesAgo: 120 },
    { senderId: user2.id, content: 'Hi Alice! I\'m doing great, thanks for asking!', minutesAgo: 115 },
    { senderId: user1.id, content: 'Did you see the new project launch?', minutesAgo: 110 },
    { senderId: user2.id, content: 'Yes! It looks amazing 🚀', minutesAgo: 105 },
  ];

  for (const msg of chat1Messages) {
    await prisma.message.create({
      data: {
        chatId: chat1.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: new Date(now.getTime() - msg.minutesAgo * 60000),
      },
    });
  }

  // Chat 2: @elionsh and Alice
  const chatWithElionsh1 = await prisma.chat.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: elionshUser.id },
          { userId: user1.id },
        ],
      },
    },
  });

  const elionshChat1Messages = [
    { senderId: user1.id, content: 'Hey! Welcome to X Clone! 👋', minutesAgo: 200 },
    { senderId: user1.id, content: 'I saw you just joined. Let me know if you need any help!', minutesAgo: 195 },
    { senderId: elionshUser.id, content: 'Thanks Alice! This looks really cool 🎉', minutesAgo: 180 },
    { senderId: user1.id, content: 'Feel free to post anything. We\'re all friendly here!', minutesAgo: 175 },
    { senderId: elionshUser.id, content: 'Will do! Looking forward to connecting with everyone', minutesAgo: 170 },
    { senderId: user1.id, content: 'Great! Let me know if you want to collaborate on anything 🚀', minutesAgo: 50 },
  ];

  for (const msg of elionshChat1Messages) {
    await prisma.message.create({
      data: {
        chatId: chatWithElionsh1.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: new Date(now.getTime() - msg.minutesAgo * 60000),
      },
    });
  }

  // Chat 3: @elionsh and Bob
  const chatWithElionsh2 = await prisma.chat.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: elionshUser.id },
          { userId: user2.id },
        ],
      },
    },
  });

  const elionshChat2Messages = [
    { senderId: user2.id, content: 'Hey! Love your profile! 🔥', minutesAgo: 300 },
    { senderId: elionshUser.id, content: 'Thanks Bob! Your projects look amazing', minutesAgo: 290 },
    { senderId: user2.id, content: 'We should definitely work on something together', minutesAgo: 280 },
    { senderId: elionshUser.id, content: 'Absolutely! I\'m always up for new projects', minutesAgo: 275 },
    { senderId: user2.id, content: 'Perfect! I\'ll send you some ideas soon', minutesAgo: 100 },
  ];

  for (const msg of elionshChat2Messages) {
    await prisma.message.create({
      data: {
        chatId: chatWithElionsh2.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: new Date(now.getTime() - msg.minutesAgo * 60000),
      },
    });
  }

  // Chat 4: @elionsh and Charlie
  const chatWithElionsh3 = await prisma.chat.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: elionshUser.id },
          { userId: user3.id },
        ],
      },
    },
  });

  const elionshChat3Messages = [
    { senderId: user3.id, content: 'Hey! Quick question about your tech stack', minutesAgo: 150 },
    { senderId: elionshUser.id, content: 'Sure, what do you want to know?', minutesAgo: 145 },
    { senderId: user3.id, content: 'Are you using Next.js for the frontend?', minutesAgo: 140 },
    { senderId: elionshUser.id, content: 'Yes! Next.js with Tailwind CSS', minutesAgo: 135 },
    { senderId: user3.id, content: 'Nice combo! That\'s what I use too 👍', minutesAgo: 130 },
  ];

  for (const msg of elionshChat3Messages) {
    await prisma.message.create({
      data: {
        chatId: chatWithElionsh3.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: new Date(now.getTime() - msg.minutesAgo * 60000),
      },
    });
  }

  // Group Chat: Tech Team with @elionsh
  const groupChat = await prisma.chat.create({
    data: {
      name: 'Tech Team 💻',
      isGroup: true,
      members: {
        create: [
          { userId: elionshUser.id, isAdmin: true },
          { userId: user1.id },
          { userId: user2.id },
          { userId: user3.id },
        ],
      },
    },
  });

  const groupMessages = [
    { senderId: elionshUser.id, content: 'Welcome to the Tech Team group! 🎉', minutesAgo: 400 },
    { senderId: user1.id, content: 'Thanks for creating this!', minutesAgo: 395 },
    { senderId: user2.id, content: 'Excited to be here!', minutesAgo: 390 },
    { senderId: user3.id, content: 'Can\'t wait to collaborate with everyone', minutesAgo: 385 },
    { senderId: elionshUser.id, content: 'Let\'s use this chat to share ideas and updates', minutesAgo: 380 },
    { senderId: user1.id, content: 'I have some exciting news to share soon 👀', minutesAgo: 200 },
    { senderId: user2.id, content: 'Looking forward to it!', minutesAgo: 195 },
    { senderId: elionshUser.id, content: 'Reminder: Team meeting tomorrow at 3pm', minutesAgo: 30 },
    { senderId: user3.id, content: 'Got it, thanks for the reminder!', minutesAgo: 25 },
  ];

  for (const msg of groupMessages) {
    await prisma.message.create({
      data: {
        chatId: groupChat.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: new Date(now.getTime() - msg.minutesAgo * 60000),
      },
    });
  }

  // Another group chat: Design Critique with @elionsh
  const designGroup = await prisma.chat.create({
    data: {
      name: 'Design Critique 🎨',
      isGroup: true,
      members: {
        create: [
          { userId: user4.id, isAdmin: true },
          { userId: elionshUser.id },
          { userId: user5.id },
        ],
      },
    },
  });

  const designMessages = [
    { senderId: user4.id, content: 'Created this group for design feedback!', minutesAgo: 500 },
    { senderId: elionshUser.id, content: 'Great idea Diana!', minutesAgo: 495 },
    { senderId: user5.id, content: 'Can\'t wait to share some mockups', minutesAgo: 490 },
    { senderId: user4.id, content: 'Feel free to share anything you\'re working on', minutesAgo: 485 },
    { senderId: elionshUser.id, content: 'I\'ll share my new landing page design tomorrow', minutesAgo: 100 },
  ];

  for (const msg of designMessages) {
    await prisma.message.create({
      data: {
        chatId: designGroup.id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: new Date(now.getTime() - msg.minutesAgo * 60000),
      },
    });
  }

  // Create some notifications for @elionsh
  for (let i = 0; i < 3; i++) {
    const randomUser = followedUsers[Math.floor(Math.random() * followedUsers.length)];
    const randomTweet = followedTweets[Math.floor(Math.random() * followedTweets.length)];
    
    await prisma.notification.create({
      data: {
        type: 'like',
        userId: elionshUser.id,
        actorId: randomUser.id,
        tweetId: randomTweet.id,
        createdAt: new Date(now.getTime() - Math.random() * 60 * 60000),
      },
    });
  }

  // Follow notifications
  for (const seedUser of followedUsers.slice(0, 3)) {
    await prisma.notification.create({
      data: {
        type: 'follow',
        userId: elionshUser.id,
        actorId: seedUser.id,
        createdAt: new Date(now.getTime() - Math.random() * 120 * 60000),
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log('   - 5 followed users (alice, bob, charlie, diana, evan)');
  console.log('   - 6 unfollowed users (frank, grace, henry, ivy, jack, kate)');
  console.log('   - 20 tweets from followed users');
  console.log('   - 120 tweets from unfollowed users (20 each)');
  console.log('   - Follow relationships (@elionsh follows only the first 5)');
  console.log('   - 5 retweets by @elionsh');
  console.log('   - 3 direct chats with @elionsh');
  console.log('   - 2 group chats including @elionsh');
  console.log('   - Notifications for @elionsh');
  console.log(`   - @elionsh user ${realUser ? 'preserved' : 'created'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
