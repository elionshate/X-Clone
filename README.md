# X Clone

A Twitter/X clone built with modern web technologies.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Clerk** - Authentication and user management

### Backend
- **NestJS** - Node.js framework for building scalable server-side applications
- **Prisma** - Type-safe ORM for database operations
- **SQLite** - Database (easily switchable to PostgreSQL/MySQL)

## Features

- 🔐 User authentication with Clerk
- 📝 Create, read, and delete tweets
- 💬 Comment on tweets
- ❤️ Like tweets and comments
- 🔄 Retweet functionality
- 👥 Follow/Unfollow users
- 📰 "For You" and "Following" feeds
- 🌙 Dark/Light theme support
- ♾️ Infinite scroll
- 👤 User profiles

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/X-clone.git
cd X-clone
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

4. Start the backend server:
```bash
npm run start:dev
```

5. In a new terminal, install frontend dependencies:
```bash
cd frontend
npm install
```

6. Create a `.env.local` file in the frontend directory with your Clerk keys:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

7. Start the frontend development server:
```bash
npm run dev
```

8. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
X-clone/
├── backend/
│   ├── src/
│   │   ├── tweet/       # Tweet module
│   │   ├── user/        # User module
│   │   ├── comment/     # Comment module
│   │   └── ...
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js app router pages
│   │   ├── components/  # React components
│   │   ├── lib/         # Utility functions and API
│   │   └── providers/   # Context providers
│   └── ...
└── README.md
```

## License

MIT
