-- CreateTable
CREATE TABLE "Retweet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tweetId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Retweet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Retweet_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Retweet_userId_idx" ON "Retweet"("userId");

-- CreateIndex
CREATE INDEX "Retweet_tweetId_idx" ON "Retweet"("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "Retweet_userId_tweetId_key" ON "Retweet"("userId", "tweetId");
