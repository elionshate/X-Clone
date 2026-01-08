import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentLikesDto, CreateReplyDto, LikeCommentDto } from './dto/comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post()
  async createComment(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(createCommentDto);
  }

  @Post('reply')
  async createReply(@Body() createReplyDto: CreateReplyDto) {
    return this.commentService.createReply(createReplyDto);
  }

  @Get(':id')
  async getCommentById(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.getCommentById(id);
  }

  @Get(':id/replies')
  async getRepliesByCommentId(
    @Param('id', ParseIntPipe) id: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.commentService.getRepliesByCommentId(
      id,
      parseInt(skip),
      parseInt(take),
    );
  }

  @Get('tweet/:tweetId')
  async getCommentsByTweetId(
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '20',
  ) {
    return this.commentService.getCommentsByTweetId(
      tweetId,
      parseInt(skip),
      parseInt(take),
    );
  }

  @Get('user/:userId')
  async getCommentsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.commentService.getCommentsByUserId(
      userId,
      parseInt(skip),
      parseInt(take),
    );
  }

  @Get('user/:userId/posts')
  async getCommentsOnUserPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '20',
  ) {
    return this.commentService.getCommentsOnUserPosts(
      userId,
      parseInt(skip),
      parseInt(take),
    );
  }

  @Patch(':id')
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
  ) {
    return this.commentService.updateComment(id, content);
  }

  @Delete(':id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.deleteComment(id);
  }

  @Patch(':id/likes')
  async updateCommentLikes(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCommentLikesDto,
  ) {
    return this.commentService.updateCommentLikes(id, updateDto);
  }

  @Post(':id/like')
  async likeComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() likeDto: LikeCommentDto,
  ) {
    return this.commentService.likeComment(id, likeDto.userId);
  }

  @Post(':id/unlike')
  async unlikeComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() likeDto: LikeCommentDto,
  ) {
    return this.commentService.unlikeComment(id, likeDto.userId);
  }

  @Get(':id/hasLiked/:userId')
  async hasUserLikedComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.commentService.hasUserLikedComment(id, userId);
  }

  @Get('tweet/:tweetId/count')
  async getCommentCount(@Param('tweetId', ParseIntPipe) tweetId: number) {
    const count = await this.commentService.getCommentCount(tweetId);
    return { count };
  }

  // View count endpoints
  @Post(':id/view')
  async incrementViewCount(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.incrementViewCount(id);
  }

  @Post('views/batch')
  async incrementViewCountBatch(@Body('ids') ids: number[]) {
    return this.commentService.incrementViewCountBatch(ids);
  }

  // Bookmark endpoints
  @Post(':id/bookmark')
  async bookmarkComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeCommentDto,
  ) {
    return this.commentService.bookmarkComment(id, dto.userId);
  }

  @Post(':id/unbookmark')
  async unbookmarkComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeCommentDto,
  ) {
    return this.commentService.unbookmarkComment(id, dto.userId);
  }

  @Get(':id/hasBookmarked/:userId')
  async hasUserBookmarkedComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.commentService.hasUserBookmarkedComment(id, userId);
  }

  @Get('bookmarks/user/:userId')
  async getBookmarkedComments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '20',
  ) {
    return this.commentService.getBookmarkedComments(userId, parseInt(skip), parseInt(take));
  }

  // Retweet endpoints
  @Post(':id/retweet')
  async retweetComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeCommentDto,
  ) {
    return this.commentService.retweetComment(id, dto.userId);
  }

  @Post(':id/unretweet')
  async unretweetComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeCommentDto,
  ) {
    return this.commentService.unretweetComment(id, dto.userId);
  }

  @Get(':id/hasRetweeted/:userId')
  async hasUserRetweetedComment(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.commentService.hasUserRetweetedComment(id, userId);
  }

  // Get comments with full interactions for post detail view
  @Get('tweet/:tweetId/interactions/:userId')
  async getCommentsWithInteractions(
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '20',
  ) {
    return this.commentService.getCommentsWithInteractions(
      tweetId,
      userId,
      parseInt(skip),
      parseInt(take),
    );
  }
}
