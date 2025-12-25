export class CreateNotificationDto {
  type: string; // 'like', 'retweet', 'comment', 'follow'
  userId: number; // recipient
  actorId: number; // who triggered
  tweetId?: number;
  commentId?: number;
}

export class MarkReadDto {
  notificationIds: number[];
}
