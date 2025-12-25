-- AlterTable
ALTER TABLE "Tweet" ADD COLUMN "latitude" REAL;
ALTER TABLE "Tweet" ADD COLUMN "location" TEXT;
ALTER TABLE "Tweet" ADD COLUMN "longitude" REAL;

-- CreateTable
CREATE TABLE "MessageMedia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageId" INTEGER NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MessageMedia_messageId_idx" ON "MessageMedia"("messageId");
