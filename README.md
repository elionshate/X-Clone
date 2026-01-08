# X Clone

A full-featured Twitter/X clone built with modern web technologies featuring real-time social interactions, user authentication, and a responsive dark/light theme.

## 🛠️ Technologies Used

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router for server-side rendering and routing |
| **TypeScript** | Type-safe JavaScript for better developer experience |
| **Tailwind CSS** | Utility-first CSS framework for rapid UI development |
| **Clerk** | Authentication and user management |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **NestJS** | Node.js framework for building scalable server-side applications |
| **Prisma** | Type-safe ORM for database operations |
| **SQLite** | Lightweight relational database (easily switchable to PostgreSQL/MySQL) |
| **TypeScript** | Type-safe backend development |

## ✨ Features

- 🔐 **User Authentication** - Secure sign-in/sign-up with Clerk
- 📝 **Tweet Management** - Create, edit, and delete tweets with media support
- 💬 **Comments System** - Comment on tweets with nested replies
- ❤️ **Interactions** - Like, retweet, and bookmark tweets and comments
- 👥 **Social Features** - Follow/Unfollow users, view followers/following
- 📰 **Smart Feeds** - "For You" (discover) and "Following" feeds
- 🔍 **Explore Page** - Discover trending content, news, sports, and entertainment
- 👤 **User Profiles** - View user profiles with tabs for posts, replies, likes, and media
- 🔔 **Notifications** - Real-time notification system
- 💬 **Direct Messages** - Chat functionality between users
- 🌙 **Theme Support** - Dark/Light/Dim theme modes
- ♾️ **Infinite Scroll** - Seamless content loading
- 📱 **Responsive Design** - Works on all screen sizes
- 📍 **Location Support** - Add location to tweets
- 👁️ **View Tracking** - Track views on tweets and comments

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                         Port: 3001                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │      Providers          │  │
│  │  (App Dir)  │  │  (Reusable) │  │  (Theme, Auth Context)  │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────────────┼─────────────────────┘                 │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │   API Layer │ (lib/api.ts)                   │
│                   └──────┬──────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTP REST
┌──────────────────────────▼──────────────────────────────────────┐
│                         Backend (NestJS)                         │
│                         Port: 3000                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Modules                               │  │
│  │  ┌──────┐ ┌──────┐ ┌─────────┐ ┌────────┐ ┌────────────┐  │  │
│  │  │Tweet │ │ User │ │ Comment │ │Bookmark│ │Notification│  │  │
│  │  └──┬───┘ └──┬───┘ └────┬────┘ └───┬────┘ └─────┬──────┘  │  │
│  │     │        │          │          │            │          │  │
│  │     └────────┴──────────┴──────────┴────────────┘          │  │
│  │                         │                                  │  │
│  └─────────────────────────┼─────────────────────────────────┘  │
│                            │                                     │
│                     ┌──────▼──────┐                              │
│                     │   Prisma    │ (ORM)                        │
│                     └──────┬──────┘                              │
└────────────────────────────┼────────────────────────────────────┘
                             │
                      ┌──────▼──────┐
                      │   SQLite    │
                      │  Database   │
                      └─────────────┘
```

### Module Structure

Each backend module follows NestJS conventions:
- **Controller** - Handles HTTP requests and routes
- **Service** - Contains business logic
- **DTO** - Data Transfer Objects for validation
- **Module** - Wires everything together

### Database Schema (Key Models)

- **User** - User accounts with profile info
- **Tweet** - Posts with content, media, location
- **Comment** - Comments on tweets with nested replies
- **Follow** - User follow relationships
- **Like/CommentLike** - Like interactions
- **Retweet/CommentRetweet** - Repost functionality
- **Bookmark/CommentBookmark** - Save content
- **Notification** - User notifications
- **Chat/Message** - Direct messaging

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation & Running Locally

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/X-clone.git
cd X-clone
```

2. **Set up the Backend:**
```bash
cd backend
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="file:./dev.db"
```

4. **Initialize the database:**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Seed the database (optional - adds sample data):**
```bash
npx tsx prisma/seed.ts
```

6. **Start the backend server:**
```bash
npm run start:dev
```
The backend will run on [http://localhost:3000](http://localhost:3000)

7. **Set up the Frontend (in a new terminal):**
```bash
cd frontend
npm install
```

8. **Configure frontend environment variables:**

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> 📝 Get your Clerk API keys from [clerk.com](https://clerk.com) by creating a free account and application.

9. **Start the frontend development server:**
```bash
npm run dev
```

10. **Open the application:**

Navigate to [http://localhost:3001](http://localhost:3001) in your browser.

## 📁 Project Structure

```
X-clone/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── tweet/             # Tweet module (CRUD, likes, retweets)
│   │   ├── user/              # User module (profiles, follows)
│   │   ├── comment/           # Comment module (replies, interactions)
│   │   ├── bookmark/          # Bookmark module
│   │   ├── notification/      # Notification module
│   │   ├── chat/              # Chat/messaging module
│   │   ├── prisma.service.ts  # Database connection
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.ts            # Database seeder
│   │   └── migrations/        # Database migrations
│   └── package.json
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/         # Route pages
│   │   │   │   ├── home/      # Home feed
│   │   │   │   ├── explore/   # Explore/discover
│   │   │   │   ├── profile/   # User profile
│   │   │   │   ├── bookmarks/ # Saved posts
│   │   │   │   ├── notification/ # Notifications
│   │   │   │   ├── chat/      # Messages
│   │   │   │   └── settings/  # User settings
│   │   │   ├── layout.tsx     # Root layout
│   │   │   └── globals.css    # Global styles
│   │   ├── components/        # Reusable React components
│   │   │   ├── feed.tsx       # Main feed component
│   │   │   ├── sidebar.tsx    # Navigation sidebar
│   │   │   ├── post-detail-modal.tsx  # Post detail view
│   │   │   ├── expanded-post.tsx      # Expanded post view
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── api.ts         # API client functions
│   │   └── providers/
│   │       └── theme-provider.tsx  # Theme context
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Tweets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tweet` | Get all tweets |
| GET | `/tweet/:id` | Get tweet by ID |
| POST | `/tweet` | Create new tweet |
| DELETE | `/tweet/:id` | Delete tweet |
| POST | `/tweet/:id/like` | Like a tweet |
| POST | `/tweet/:id/retweet` | Retweet |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/:username` | Get user profile |
| POST | `/user/:id/follow` | Follow user |
| DELETE | `/user/:id/unfollow` | Unfollow user |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/comment/tweet/:tweetId` | Get comments for tweet |
| POST | `/comment` | Create comment |
| POST | `/comment/:id/like` | Like comment |
| POST | `/comment/:id/bookmark` | Bookmark comment |

### Utility Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with DB status |
| GET | `/geolocation` | Server-side geolocation |

## 🔧 Troubleshooting

### Verifying the Backend is Running

Check the health endpoint:
```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Mac/Linux/Git Bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T...",
  "version": "1.0.0",
  "database": { "connected": true, "path": "..." },
  "uptime": 123.456
}
```

### Database Issues

**Database Auto-Seed Not Working:**
```bash
cd backend
npx tsx prisma/seed.ts
```

The seed script will output detailed logs showing:
- Working directory
- Database path being used
- Whether seeding succeeded or failed

**Database Not Found:**
```bash
cd backend
npx prisma migrate dev
```

**Reset Database Completely:**
```bash
cd backend
Remove-Item dev.db    # Windows
# rm dev.db           # Mac/Linux
npx prisma migrate dev
npx tsx prisma/seed.ts
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Kill existing Node processes or change port in `backend/src/main.ts` |
| CORS errors | Ensure backend runs on port 3000, frontend on port 3001 |
| Authentication errors | Verify Clerk API keys in `.env.local` |
| Prisma client errors | Run `npx prisma generate` in backend folder |
| Backend 404 errors | Run `npx prisma generate` then restart backend |
| Geolocation not working | Backend provides `/geolocation` proxy endpoint |

## 📄 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

See `backend/.env.example` for full reference.

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

See `frontend/.env.example` for full reference.

## 📸 Screenshots

The application features:
- Clean, modern UI similar to X/Twitter
- Dark and light theme modes
- Responsive design for all screen sizes
- Full-screen post detail modals for posts with images
- Inline expanded views for text-only posts

