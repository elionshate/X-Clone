import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.tweetMedia.deleteMany();
  await prisma.tweet.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.user.deleteMany();

  // Create 5 mock users
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

  const users = [user1, user2, user3, user4, user5];

  // Create follow relationships
  await prisma.userFollow.create({
    data: { followerId: user1.id, followingId: user2.id },
  });
  await prisma.userFollow.create({
    data: { followerId: user1.id, followingId: user3.id },
  });
  await prisma.userFollow.create({
    data: { followerId: user2.id, followingId: user1.id },
  });
  await prisma.userFollow.create({
    data: { followerId: user2.id, followingId: user4.id },
  });
  await prisma.userFollow.create({
    data: { followerId: user3.id, followingId: user5.id },
  });
  await prisma.userFollow.create({
    data: { followerId: user4.id, followingId: user1.id },
  });
  await prisma.userFollow.create({
    data: { followerId: user5.id, followingId: user2.id },
  });

  // Create 20 tweets
  const tweetContents = [
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

  let tweetIndex = 0;
  for (let i = 0; i < 20; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomLikes = Math.floor(Math.random() * 500);
    const randomRetweets = Math.floor(Math.random() * 200);

    const tweet = await prisma.tweet.create({
      data: {
        content: tweetContents[tweetIndex % tweetContents.length],
        authorId: randomUser.id,
        likeCount: randomLikes,
        retweetCount: randomRetweets,
      },
    });

    // Add comments to some tweets
    if (Math.random() > 0.5) {
      const commentUser =
        users[Math.floor(Math.random() * users.length)];
      await prisma.comment.create({
        data: {
          content: 'Great post! Love this! ❤️',
          authorId: commentUser.id,
          tweetId: tweet.id,
          likeCount: Math.floor(Math.random() * 50),
        },
      });
    }

    if (Math.random() > 0.7) {
      const commentUser =
        users[Math.floor(Math.random() * users.length)];
      await prisma.comment.create({
        data: {
          content: 'This is very helpful, thanks for sharing!',
          authorId: commentUser.id,
          tweetId: tweet.id,
          likeCount: Math.floor(Math.random() * 30),
        },
      });
    }

    tweetIndex++;
  }

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log('   - 5 users');
  console.log('   - 20 tweets');
  console.log('   - 7 follow relationships');
  console.log('   - Multiple comments');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
